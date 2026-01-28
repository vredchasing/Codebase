// ==================== Agent Framework ====================

/*
                  ┌───────────────┐
                  │  User Query   │
                  └───────┬───────┘
                          │
                          ▼
               ┌───────────────────┐
               │  Blackboard /     │
               │  Agent State      │
               │------------------│
               │ userQuery         │
               │ memorySummaries   │
               │ openFiles         │
               │ toolResults       │
               │ scratchpad        │
               │ fileTombstones    │
               │ grepCount         │
               └───────┬───────────┘
                       │
                       ▼
               ┌───────────────────┐
               │       LLM         │
               │------------------│
               │ Receives:         │
               │ - Full blackboard │
               │ - System prompt   │
               │------------------│
               │ Outputs:          │
               │ - Tool calls      │
               │ - Partial answer  │
               │ - Final answer    │
               └───────┬───────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌─────────────────┐          ┌─────────────────┐
│  MCP / Tools    │          │  LLM Content    │
│-----------------|          │  Processing     │
│ Executes tool   │          │-----------------│
│ calls in        │          │ - Append low-   │
│ parallel        │          │   confidence    │
│ Returns results │          │   output to     │
│                 │          │   scratchpad    │
└─────────┬───────┘          └─────────┬───────┘
          │                            │
          ▼                            ▼
   ┌───────────────┐           ┌─────────────────────┐
   │  Tool Results │           │ Scratchpad Summar-  │
   │  Aggregation  │           │  ization & Trimming │
   │---------------│           │--------------------│
   │ Deduplicate   │           │ LLM summarizes long │
   │ Tombstone     │           │ scratchpad to       │
   │ Summarize     │           │ memorySummaries     │
   │ Summarize     │           │ Keep trailing ctx   │
   └───────────────┘           └───────────────┬─────┘
                                            │
                                            ▼
                                     ┌─────────────┐
                                     │ Updated     │
                                     │ Blackboard  │
                                     │ (next loop) │
                                     └─────┬───────┘
                                           │
                                ┌──────────┴──────────┐
                                │ Loop until LLM sets │
                                │ done = true         │
                                └──────────┬──────────┘
                                           ▼
                                     ┌─────────────┐
                                     │ Final Answer│
                                     └─────────────┘
*/

const MAX_STEPS = 12;
const MAX_GREP_CALLS = 10;
const CONFIDENCE_THRESHOLD = 0.85;
const TOOL_RESULTS_SUMMARY_THRESHOLD = 5;
const MAX_MEMORY_SUMMARIES = 20;
const MAX_SCRATCHPAD_CHARS = 2000;
const SCRATCHPAD_RETAIN_CHARS = 500; // trailing context retention

// ----------------- Blackboard / State -----------------
function createInitialState(userQuery) {
  return {
    userQuery,
    memorySummaries: [],
    openFiles: [],
    toolResults: [],
    scratchpad: "",
    stepCount: 0,
    done: false,
    fileTombstones: {}, // { path: { summary, version } }
    grepCount: 0,
    toolCallCache: {},  // deduplication
  };
}

// ----------------- System Prompt / Policies -----------------
function buildSystemPrompt() {
  return `
    You are a retrieval-augmented coding agent.

    Rules:
    - Decide what info is missing before acting
    - Prefer precise search (grep/symbol) for identifiers
    - Prefer semantic search for conceptual questions
    - Avoid rereading files already summarized
    - Stop when confident
    - Do not over-gather context

    You may:
    - Call MCP tools
    - Ask for clarification
    - Answer directly

    Never reveal scratchpad or internal reasoning.
  `;
}

// ----------------- Serialize State for LLM -----------------
function serializeState(state) {
  return `
    USER QUERY:
    ${state.userQuery}

    MEMORY SUMMARIES:
    ${state.memorySummaries.join("\n---\n")}

    OPEN FILES:
    ${state.openFiles.map(f => `File: ${f.path}\n${f.content}`).join("\n---\n")}

    TOOL RESULTS:
    ${state.toolResults.map(r =>
      `Tool: ${r.tool}\nInput: ${JSON.stringify(r.input)}\nOutput:\n${JSON.stringify(r.output)}`
    ).join("\n---\n")}

    SCRATCHPAD:
    ${state.scratchpad}
    `;
}

// ----------------- Deduplication -----------------
function isDuplicateToolCall(state, toolName, args) {
  return state.toolResults.some(
    r => r.tool === toolName && JSON.stringify(r.input) === JSON.stringify(args)
  );
}

// ----------------- File Tombstones -----------------
function addFileTombstone(state, path, content, version) {
  const summary = `Summary of ${path}: ${content.slice(0, 500)}...`;
  state.fileTombstones[path] = { summary, version };
}

// ----------------- Summarization Helpers -----------------
async function summarizeToolResults(llm, toolResults) {
  if (!toolResults || toolResults.length === 0) return null;

  const inputText = toolResults.map(r => 
    `Tool: ${r.tool}\nInput: ${JSON.stringify(r.input)}\nOutput:\n${JSON.stringify(r.output)}`
  ).join("\n---\n");

  const summaryResponse = await llm.generate({
    system: "Summarize the following tool outputs concisely for future reference.",
    user: inputText,
  });

  return summaryResponse.content;
}

async function summarizeScratchpadIfNeeded(llm, state, maxChars = MAX_SCRATCHPAD_CHARS, retainChars = SCRATCHPAD_RETAIN_CHARS) {
  if (state.scratchpad.length <= maxChars) return;

  const summaryResponse = await llm.generate({
    system: "Summarize this internal reasoning into concise knowledge for future reference. Remove speculative or redundant text.",
    user: state.scratchpad
  });

  if (summaryResponse.content) {
    // Append summary to memory
    state.memorySummaries.push(summaryResponse.content);

    // Retain last few characters as trailing context
    state.scratchpad = state.scratchpad.slice(-retainChars);

    trimMemorySummaries(state);
  }
}

function trimMemorySummaries(state) {
  if (state.memorySummaries.length > MAX_MEMORY_SUMMARIES) {
    state.memorySummaries = state.memorySummaries.slice(-MAX_MEMORY_SUMMARIES);
  }
}

function trimScratchpad(state) {
  if (state.scratchpad.length > MAX_SCRATCHPAD_CHARS) {
    state.scratchpad = state.scratchpad.slice(-MAX_SCRATCHPAD_CHARS);
  }
}

// ----------------- Main Agent Loop -----------------
async function runAgent({ userQuery, llm, mcp }) {
  const state = createInitialState(userQuery);
  const systemPrompt = buildSystemPrompt();

  while (!state.done) {
    if (state.stepCount++ > MAX_STEPS) {
      throw new Error("Agent exceeded max steps");
    }

    // LLM sees entire blackboard
    const llmResponse = await llm.generate({
      system: systemPrompt,
      user: serializeState(state),
      tools: mcp.listTools(),
    });

    // ----------------- TOOL CALLS -----------------
    if (llmResponse.tool_calls && llmResponse.tool_calls.length > 0) {
      const newCalls = llmResponse.tool_calls.filter(tc => 
        !isDuplicateToolCall(state, tc.name, tc.arguments)
      );

      const filteredCalls = newCalls.filter(tc => {
        if (tc.name === "grep") {
          if (state.grepCount >= MAX_GREP_CALLS) return false;
          state.grepCount++;
        }
        return true;
      });

      // Execute tool calls in parallel
      const results = await Promise.all(filteredCalls.map(tc => mcp.execute(tc.name, tc.arguments)));

      results.forEach((output, i) => {
        const call = filteredCalls[i];
        state.toolResults.push({
          tool: call.name,
          input: call.arguments,
          output,
        });

        if (call.name === "readFile") {
          addFileTombstone(state, call.arguments.path, output, call.arguments.version || "latest");
        }
      });

      // Automatic toolResults summarization
      if (state.toolResults.length >= TOOL_RESULTS_SUMMARY_THRESHOLD) {
        const summary = await summarizeToolResults(llm, state.toolResults);
        if (summary) state.memorySummaries.push(summary);
        state.toolResults = [];
      }

      // Automatic scratchpad summarization with trailing context
      await summarizeScratchpadIfNeeded(llm, state, MAX_SCRATCHPAD_CHARS, SCRATCHPAD_RETAIN_CHARS);

      trimMemorySummaries(state);
      trimScratchpad(state);

      continue;
    }

    // ----------------- FINAL ANSWER -----------------
    if (llmResponse.content) {
      if (!llmResponse.confidence || llmResponse.confidence >= CONFIDENCE_THRESHOLD) {
        state.done = true;
        return llmResponse.content;
      } else {
        // Low confidence → append to scratchpad and continue
        state.scratchpad += `\n[Low-confidence output]: ${llmResponse.content}`;
        await summarizeScratchpadIfNeeded(llm, state, MAX_SCRATCHPAD_CHARS, SCRATCHPAD_RETAIN_CHARS);
        continue;
      }
    }

    throw new Error("LLM returned neither tool call nor content");
  }
}
