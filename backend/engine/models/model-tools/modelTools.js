export const model_tools = [
  {
    name: "readFile",
    description: "Read a file from the state tree. Optionally read only a slice.",
    parameters: {
      type: "object",
      properties: {
        fileId: { type: "string" },
        start: { type: "number", nullable: true },
        end: { type: "number", nullable: true }
      },
      required: ["fileId"]
    }
  },
  {
    
  }
];

// pure tool implementation (keeps your signature idea but args-first)
export function readFile({ fileId, start = null, end = null }, stateTree) {
  if (!stateTree || !stateTree[fileId]) {
    return `Error: File with ID '${fileId}' not found in state tree.`;
  }

  const content = stateTree[fileId];
  const s = start == null ? 0 : start;
  const e = end == null ? content.length : end;

  if (typeof s !== 'number' || typeof e !== 'number' || e < s) {
    return `Error: Invalid start/end indices.`;
  }

  return content.slice(s, e);
}

// tiny dispatcher you can call from your runtime
export function executeTool(toolName, args, runtime) {
  // runtime = { stateTree, logger?, auth? }
  if (toolName === "readFile") {
    return readFile(args, runtime.stateTree);
  }
  throw new Error(`Unknown tool: ${toolName}`);
}
