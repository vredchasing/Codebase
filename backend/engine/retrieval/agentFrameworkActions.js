async function planner(query, queryInfo, llmClient) {
  // Prompt instructions for robust task decomposition
  const prompt = `
    You are an autonomous AI planner trained to decompose complex tasks into a clear
    and structured high-level plan that can guide task execution later.
    Your output **must be valid JSON only** and follow this exact schema:

    {
      "goal": "string — restatement of the user’s goal",
      "tasks": [
        {
          "id": "string — unique identifier",
          "description": "string — clear description of the task",
          "notes": "string — optional context or dependencies",
          "expectedOutcome": "string — what successful completion looks like"
        }
      ]
    }

    The plan should be **hierarchical, coherent, and minimal** — avoid extraneous detail
    but ensure that all necessary major subtasks are represented.

    ### User Query
    "${query}"

    ### Context & Classification Metadata
    ${JSON.stringify(queryInfo, null, 2)}

    Once complete, output only the JSON plan object in exactly one block. Do not include
    any extra text outside JSON.
    `;

  const response = await llmClient.generate({
    prompt,
    temperature: 0.2,  // lower randomness for consistency
    max_tokens: 1200
  });

  return response;
}



async function actionablePlanner(query, plan, mcpOutputFormat, tools, llmClient) {
  // Convert the tool metadata into a clear, structured description for the model
  const toolsDescription = tools
    .map(tool => {
      return `
        Tool Name: ${tool.id}
        Description: ${tool.description}
        Input Schema: ${JSON.stringify(tool.inputSchema, null, 2)}
        Output Schema: ${JSON.stringify(tool.outputSchema, null, 2)}
      `;
    })
    .join("\n");

  // Build the prompt
  const prompt = `
    You are an AI agent with planning capability. Your task is to generate a fully structured, executable plan
    that a Model Context Protocol (MCP) hub can execute step by step.

    ### AVAILABLE TOOLS
    You can call the following tools. Each tool call in the plan must include:
    - tool name
    - inputs that conform to the schema
    - a brief description of intended effect

    ${toolsDescription}

    ### EXPECTED PLAN FORMAT
    Your plan must strictly follow this JSON schema:
    ${mcpOutputFormat.format}

    Here are examples of valid steps using the tools:
    ${mcpOutputFormat.examples}

    ---

    ### TASK
    User Query: \`${query}\`
    High-Level Plan Outline: \`${plan}\`

    Generate a detailed, structured plan that uses the available tools when appropriate,
    breaking the high-level plan into actionable steps. Output must be valid JSON.
    `;

  const actionablePlan = await llmClient.generate({
    prompt,
    temperature: 0.2, // for deterministic outputs
    max_tokens: 1500
  });

  return actionablePlan;
}


// actions info

const mcpOutputFormat = {

}

