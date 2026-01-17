/*Tools List*/
const tools_list = {
  grep: {
    id: 'grep',
    description: 'Search for a pattern in text or files',
    inputTypes: ['fileTree', 'string'],
    outputType: 'matches',
    async: true
  },

  summarize: {
    id: 'summarize',
    description: 'Summarize input content',
    inputTypes: ['matches', 'logEntries', 'string'],
    outputType: 'summary',
    async: true
  },

  crossCheck: {
    id: 'crossCheck',
    description: 'Compare two datasets and find correlations',
    inputTypes: ['matches', 'logEntries'],
    outputType: 'analysis',
    async: false
  }
};

export function createTool({id, description, inputSchema, outputSchema, execute}){
  return {
    id,
    description,
    inputSchema,
    outputSchema,
    execute
  };
}

export const grep_tool = createTool({
  id: 'grep',
  description: 'Search for a pattern in text or files',

  inputSchema: {
    type: 'object',
    required: ['pattern', 'content'],
    properties: {
      pattern: { type: 'string' },
      content: {
        oneOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'object' } }
        ]
      }
    }
  },

  outputSchema: {
    type: 'array',
    items: {
      file: { type: 'string' },
      line: { type: 'number' },
      match: { type: 'string' }
    }
  },

  async execute({ pattern, content }) {
    const regex = new RegExp(pattern, 'i');
    const results = [];

    if (typeof content === 'string') {
      content.split('\n').forEach((line, i) => {
        if (regex.test(line)) {
          results.push({ file: null, line: i + 1, match: line });
        }
      });
    } else {
      for (const file of content) {
        file.text.split('\n').forEach((line, i) => {
          if (regex.test(line)) {
            results.push({
              file: file.path,
              line: i + 1,
              match: line
            });
          }
        });
      }
    }

    return results;
  }
});

