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

// bTreeEngine.js

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

      if (status === STATUS.RUNNING) return STATUS.RUNNING;
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

// Selector that tries children until one succeeds
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

// Selector with memory (doesn't restart at index 0 each tick)
export class SelectorWithMemory extends BTNode {
  constructor(name, children = []) {
    super(name);
    this.children = children;
    this.currentIndex = 0;
  }

  async tick(blackboard) {
    while (this.currentIndex < this.children.length) {
      const status = await this.children[this.currentIndex].tick(blackboard);
      if (status === STATUS.SUCCESS) {
        this.currentIndex = 0;
        return STATUS.SUCCESS;
      }
      if (status === STATUS.RUNNING) return STATUS.RUNNING;
      this.currentIndex++;
    }
    this.currentIndex = 0;
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

// Timeout Decorator — fail if child takes too long
export class Timeout extends DecoratorNode {
  constructor(name, child, timeoutMs) {
    super(name, child);
    this.timeoutMs = timeoutMs;
  }

  async tick(blackboard) {
    return await Promise.race([
      this.child.tick(blackboard),
      new Promise((resolve) =>
        setTimeout(() => resolve(STATUS.FAILURE), this.timeoutMs)
      )
    ]);
  }
}

// 🔁 Retry Decorator — retry on failure up to N times
export class Retry extends DecoratorNode {
  constructor(name, child, maxRetries = 3) {
    super(name, child);
    this.maxRetries = maxRetries;
    this.attempts = 0;
  }

  async tick(blackboard) {
    while (this.attempts < this.maxRetries) {
      const status = await this.child.tick(blackboard);
      if (status === STATUS.SUCCESS) {
        this.attempts = 0;
        return STATUS.SUCCESS;
      }
      this.attempts++;
    }
    this.attempts = 0;
    return STATUS.FAILURE;
  }
}

// 🧪 Condition Decorator — only runs child if condition passes
export class ConditionNode extends DecoratorNode {
  constructor(name, conditionFn, child) {
    super(name, child);
    this.conditionFn = conditionFn;
  }

  async tick(blackboard) {
    if (await this.conditionFn(blackboard)) {
      return await this.child.tick(blackboard);
    }
    return STATUS.FAILURE;
  }
}

// Runner to step the behavior tree
export async function runTree(root, blackboard, opts = {}) {
  let status;
  do {
    status = await root.tick(blackboard);
  } while (status === STATUS.RUNNING);
  return { status, blackboard };
}



// treeNodes.js

import { STATUS } from "./btEngine.js";
import { record } from "./blackboard.js";

// High-level planning orchestrated by the LLM
export const HighLevelPlan = (llmClient) =>
  new LeafNode("HighLevelPlan", async (bb) => {
    record(bb, "HighLevelPlan invoked.");
    const prompt = `Generate a high level plan for this query: ${bb.initialQuery}`;
    bb.highLevelPlan = await llmClient.generate(prompt);
    return STATUS.SUCCESS;
  });

// Turns high-level plan into actionable steps
export const ActionablePlan = (llmClient) =>
  new LeafNode("ActionablePlan", async (bb) => {
    record(bb, "ActionablePlan invoked.");
    const prompt = `Convert this plan to steps:\n${JSON.stringify(bb.highLevelPlan)}`;
    bb.actionableSteps = await llmClient.generate(prompt);
    bb.nextActionIndex = 0;
    return STATUS.SUCCESS;
  });

// Executes current actionable step via MCP,
// auto-advances on success, flags replanning on failure
export const ExecuteTool = (MCP) =>
  new LeafNode("ExecuteTool", async (bb) => {
    const step = bb.actionableSteps[bb.nextActionIndex];
    if (!step) return STATUS.SUCCESS; // done
    record(bb, `ExecuteTool: ${step.tool}`);
    try {
      const result = await MCP.executeTool(step.tool, step.args);
      bb.lastToolOutput = result;
      bb.nextActionIndex++;
      return STATUS.SUCCESS;
    } catch (err) {
      bb.lastToolError = err;
      bb.errorCount++;
      bb.needsReplan = true;
      return STATUS.FAILURE;
    }
  });

// Reflection (LLM interpret outcome)
export const Reflect = (llmClient) =>
  new LeafNode("Reflect", async (bb) => {
    record(bb, "Reflect invoked.");
    const prompt = `Reflect on last output: ${JSON.stringify(bb.lastToolOutput)}`;
    bb.reflectionNotes = await llmClient.generate(prompt);
    return STATUS.SUCCESS;
  });

// Replan based on new context
export const Replan = (llmClient) =>
  new LeafNode("Replan", async (bb) => {
    record(bb, "Replan invoked.");
    const prompt = `Given partial execution and errors, replan:\n${JSON.stringify(bb)}`;
    bb.highLevelPlan = await llmClient.generate(prompt);
    bb.needsReplan = false;
    bb.replans++;
    bb.nextActionIndex = 0;
    return STATUS.SUCCESS;
  });

// Final synthesis for user
export const SynthesizeOutput = (llmClient) =>
  new LeafNode("SynthesizeOutput", async (bb) => {
    record(bb, "SynthesizeOutput invoked.");
    const prompt = `Produce user answer from context:\n${JSON.stringify(bb)}`;
    bb.finalOutput = await llmClient.generate(prompt);
    return STATUS.SUCCESS;
  });


  import {
  Sequence,
  Selector,
  Retry,
  Timeout,
  ConditionNode
} from "./btEngine.js";
import {
  HighLevelPlan,
  ActionablePlan,
  ExecuteTool,
  Reflect,
  Replan,
  SynthesizeOutput
} from "./treeNodes.js";

export function buildBehaviorTree(llmClient, MCP) {
  return new Sequence("Root", [

    HighLevelPlan(llmClient),
    ActionablePlan(llmClient),

    // Core execution loop
    new Selector("ExecOrReplan", [
      
      // If we need a replan, do that first
      new ConditionNode(
        "NeedsReplan?",
        bb => bb.needsReplan,
        new Replan(llmClient)
      ),

      // Normal execution sub-sequence
      new Sequence("PlanExec", [
        new Retry(
          "RetryExecTool",
          new Timeout("ToolTimeout", ExecuteTool(MCP), 5000),
          2
        ),
        Reflect(llmClient)
      ])
    ]),

    SynthesizeOutput(llmClient)
  ]);
}


// agentRunner.js

import { createBlackboard } from "./blackboard.js";

import { createBlackboard } from "./blackboard.js";

export async function runAgent(userQuery, llmClient, MCP) {
  const blackboard = createBlackboard(userQuery);
  blackboard.trace.push({
    timestamp: Date.now(),
    message: `Initialized blackboard for query: "${userQuery}"`
  });

  const tree = buildBehaviorTree(llmClient, MCP);

  let result;
  try {
    result = await runTree(tree, blackboard);
  } catch (err) {
    blackboard.trace.push({
      timestamp: Date.now(),
      message: `Exception running tree: ${err.stack || err.message}`
    });
    return { status: STATUS.FAILURE, blackboard };
  }

  const { status, blackboard: finalState } = result;

  return {
    status,
    finalOutput: finalState.finalOutput,
    trace: finalState.trace
  };
}
