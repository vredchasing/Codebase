const behaviorsDescriptionPrompt = {
  "behaviorTreeSpec": {
    "description": "Defines the control flow primitives and leaf behaviors available to the agent.",
    "controlNodes": {
      "Sequence": {
        "type": "composite",
        "description": "Runs children in order until one returns Failure or Running; succeeds only if all succeed."
      },
      "Selector": {
        "type": "composite",
        "description": "Runs children in order until one returns Success or Running; fails only if all fail."
      },
      "Parallel": {
        "type": "composite",
        "description": "Runs multiple children simultaneously; success/failure depends on configured thresholds."
      }
    },
    "decoratorNodes": {
      "Condition": {
        "type": "decorator",
        "description": "Checks Blackboard key(s) or computed logic; allows child if true."
      },
      "Retry": {
        "type": "decorator",
        "description": "Re-runs child node on failure up to X times."
      },
      "Timeout": {
        "type": "decorator",
        "description": "Fails child if execution takes longer than specified timeout."
      },
      "CostAware": {
        "type": "decorator",
        "description": "Chooses between alternatives based on cost heuristics (e.g., token budget)."
      }
    },
    "leafNodes": {
      "CheckGoalComplete": {
        "type": "condition",
        "description": "Checks if the agent’s global goal has been satisfied via Blackboard or state."
      },
      "HighLevelPlan": {
        "type": "action",
        "description": "Calls the LLM to produce a high-level decomposition of the query."
      },
      "ActionablePlan": {
        "type": "action",
        "description": "Calls the LLM to turn the high-level plan into executable steps."
      },
      "ExecuteTool": {
        "type": "action",
        "description": "Invokes an MCP tool (e.g., grep, file read, vector DB retrieval) and stores the result on the Blackboard."
      },
      "Reflect": {
        "type": "action",
        "description": "Calls the LLM to analyze the latest results/outcomes and update Blackboard context with insights."
      },
      "Replan": {
        "type": "action",
        "description": "Calls the LLM to adjust or regenerate parts of the plan based on failure or new context."
      },
      "SynthesizeOutput": {
        "type": "action",
        "description": "Generates the final user-facing response using accumulated context, reflections, and execution history."
      }
    },
    "executionSemantics": {
      "success": "A node returns Success when its intended effect is achieved.",
      "failure": "A node returns Failure when the intended effect could not be achieved.",
      "running": "A node returns Running if it’s still in progress and needs further ticks."
    }
  }
}


// btEngine.js

// STATUS constants for tick return values
export const STATUS = Object.freeze({
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
  RUNNING: "RUNNING"
});

// Base class for all nodes in BT
export class BTNode {
  constructor(name) {
    this.name = name;
  }
  async tick(blackboard) {
    throw new Error("tick() not implemented");
  }
}

// Composite: runs children in order
export class Sequence extends BTNode {
  constructor(name, children = []) {
    super(name);
    this.children = children;
    this.currentIndex = 0;
  }

  reset() {
    this.currentIndex = 0;
  }

  async tick(blackboard) {
    while (this.currentIndex < this.children.length) {
      const node = this.children[this.currentIndex];
      const status = await node.tick(blackboard);

      if (status === STATUS.RUNNING) {
        return STATUS.RUNNING;
      }
      if (status === STATUS.FAILURE) {
        this.reset();
        return STATUS.FAILURE;
      }
      this.currentIndex++;
    }
    this.reset();
    return STATUS.SUCCESS;
  }
}

// Composite: tries until one succeeds
export class Selector extends BTNode {
  constructor(name, children = []) {
    super(name);
    this.children = children;
  }

  async tick(blackboard) {
    for (const node of this.children) {
      const status = await node.tick(blackboard);
      if (status === STATUS.SUCCESS) return STATUS.SUCCESS;
      if (status === STATUS.RUNNING) return STATUS.RUNNING;
    }
    return STATUS.FAILURE;
  }
}

// Leaf base: accepts async function
export class LeafNode extends BTNode {
  constructor(name, fn) {
    super(name);
    this.fn = fn;
  }
  async tick(blackboard) {
    return await this.fn(blackboard);
  }
}

// Decorator base (wraps a single child)
export class DecoratorNode extends BTNode {
  constructor(name, child) {
    super(name);
    this.child = child;
  }
  async tick(blackboard) {
    throw new Error("Decorator must override tick()");
  }
}

// Runner to step the behavior tree
export async function runTree(root, blackboard, opts = {}) {
  let status;
  do {
    status = await root.tick(blackboard);
    // optionally inspect or log state here
  } while (status === STATUS.RUNNING);
  return { status, blackboard };
}



// treeNodes.js

import { STATUS } from "./btEngine.js";
import { record } from "./blackboard.js";

// High‑level planning orchestrated by the LLM
export const HighLevelPlan = (llmClient) => new LeafNode(
  "HighLevelPlan",
  async (bb) => {
    record(bb, "HighLevelPlan invoked.");
    const prompt = `Generate a high level plan for this query: ${bb.initialQuery}`;
    bb.highLevelPlan = await llmClient.generate(prompt);
    return STATUS.SUCCESS;
  }
);

// Turns high‑level plan into actionable steps
export const ActionablePlan = (llmClient) => new LeafNode(
  "ActionablePlan",
  async (bb) => {
    record(bb, "ActionablePlan invoked.");
    const prompt = `Convert this plan to steps:\n${JSON.stringify(bb.highLevelPlan)}`;
    bb.actionableSteps = await llmClient.generate(prompt);
    bb.nextActionIndex = 0;
    return STATUS.SUCCESS;
  }
);

// Executes current actionable step via MCP
export const ExecuteTool = (MCP) => new LeafNode(
  "ExecuteTool",
  async (bb) => {
    const step = bb.actionableSteps[bb.nextActionIndex];
    if (!step) return STATUS.FAILURE;
    record(bb, `ExecuteTool: ${step.tool}`);
    try {
      const result = await MCP.executeTool(step.tool, step.args);
      bb.lastToolOutput = result;
      return STATUS.SUCCESS;
    } catch (err) {
      bb.lastToolError = err;
      bb.errorCount++;
      return STATUS.FAILURE;
    }
  }
);

// Reflection (LLM interpret outcome)
export const Reflect = (llmClient) => new LeafNode(
  "Reflect",
  async (bb) => {
    record(bb, "Reflect invoked.");
    const prompt = `Reflect on last output: ${JSON.stringify(bb.lastToolOutput)}`;
    bb.reflectionNotes = await llmClient.generate(prompt);
    return STATUS.SUCCESS;
  }
);

// Replan based on new context
export const Replan = (llmClient) => new LeafNode(
  "Replan",
  async (bb) => {
    record(bb, "Replan invoked.");
    const prompt = `Given partial execution and errors, replan:\n${JSON.stringify(bb)}`;
    bb.highLevelPlan = await llmClient.generate(prompt);
    return STATUS.SUCCESS;
  }
);

// Final synthesis for user
export const SynthesizeOutput = (llmClient) => new LeafNode(
  "SynthesizeOutput",
  async (bb) => {
    record(bb, "SynthesizeOutput invoked.");
    const prompt = `Produce user answer from context:\n${JSON.stringify(bb)}`;
    bb.finalOutput = await llmClient.generate(prompt);
    return STATUS.SUCCESS;
  }
);



// agentRunner.js

import { createBlackboard } from "./blackboard.js";

/**
 * runAgent
 * The true entry point into your agentic loop.
 *
 * @param {string} userQuery - The user’s natural language request
 * @param {Object} llmClient - Your LLM client instance (e.g., OpenAI, Claude, etc.)
 * @param {Object} MCP - Your MCP hub instance (with registered tools/resources)
 *
 * @returns {Promise<Object>} - The final output plus trace logs
 */
export async function runAgent(userQuery, llmClient, MCP) {
  // 1) Initialize the Blackboard with the user’s query
  const blackboard = createBlackboard(userQuery);

  // (Optional) Record the initial state
  blackboard.trace.push({
    timestamp: Date.now(),
    message: `Initialized blackboard for query: "${userQuery}"`
  });

  // 2) Build the behavior tree using your LLM and MCP clients
  const tree = buildBehaviorTree(llmClient, MCP);

  // 3) Tick the tree until it completes (no longer RUNNING)
  let result;
  try {
    result = await runTree(tree, blackboard);
  } catch (err) {
    // Catch unexpected exceptions and log them
    blackboard.trace.push({
      timestamp: Date.now(),
      message: `Exception running tree: ${err.stack || err.message}`
    });
    return {
      status: STATUS.FAILURE,
      blackboard
    };
  }

  // 4) Collect the final output (if any) and status
  const { status, blackboard: finalState } = result;

  // 5) Return the final status and blackboard (including finalOutput & trace)
  return {
    status,
    finalOutput: finalState.finalOutput,
    trace: finalState.trace
  };
}
