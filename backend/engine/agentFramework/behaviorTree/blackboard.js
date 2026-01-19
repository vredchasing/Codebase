// blackboard.js

export const createBlackboard = (initialQuery) => ({
  // Root user query and lifecycle fields
  initialQuery: initialQuery || "",
  goalState: null,
  
  // Planning fields
  highLevelPlan: null,       // Array or structured plan
  actionableSteps: [],       // Array of steps coming from planner
  nextActionIndex: 0,        // Step pointer
  replans: 0,                // Count of replans executed
  
  // Tool/LLM interaction results
  lastToolOutput: null,
  lastToolError: null,
  reflectionNotes: null,
  
  // Status / internal flags
  errorCount: 0,
  needsReplan: false,

  // Final result place
  finalOutput: null,
  
  // Logging/debugging
  trace: []
});

// Convenience helper to record timeline events
export function record(blackboard, message) {
  blackboard.trace.push({
    timestamp: Date.now(),
    message
  });
}
