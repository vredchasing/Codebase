//MAIN QUERY TRANSFORMER FUNCTION- INCLUDES THE TRANSFORMATION PIPELINE
function transformQuery (query){
  const analyzedQuery = contextRequirementAnalysis(query);
  const structeredOutput = structureTransformedQuery(query, analyzedQuery);
  return structeredOutput
}
// Strucure the output of transformQuery function 
function structureTransformedQuery(query, analayzedQuery){
  return {
    query: query,
    queryInfo: analayzedQuery
  }
}
//======== CONTEXT REQUIREMENT ANALYSIS =========//

// AVAILABLE AGENT TOOLS FOR ANALYSIS ONLY
const contextRequirementAnalysisTools = {
  
}

// variables that store info related to helping the agent understand how to perform its task

//1. a categorizer object that helps classify what type of query was given- classification is used to perform selective tasks
const contextRequirementAnalysisClassifications = {
  SIMPLE_QUERY: 'This query does not need ANY CONTEXT (e.g., "What is the capital of France?")',  
  CHAT_HISTORY_CONTEXT: 'This query requires only chat history context (e.g., "Continue refactoring the function we discussed before")',
  VECTORDB_CONTEXT: 'This query requires only context from the DB that stores AST code chunks (e.g., "Explain this function from the codebase")',
  CHAT_HISTORY_VECTORDB_CONTEXT: 'This query requires both chat history and context from vector DB which holds AST code chunks (e.g., "Update the function based on our previous discussion and project files")',  
  AMBIGUOUS: 'This query is ambiguous or unclear and may need disambiguation from the user (e.g., "How do I optimize this?")',  
  TOOL_REQUIRED: 'This query requires execution of tools or access to external systems (e.g., "Run a linter or test suite")',  
  MULTI_STEP: 'This query requires multiple steps or reasoning over multiple contexts (e.g., "Summarize all TODOs and propose refactors")',  
};
//2. Desired output structure, helps to normalize what type of response should be given- mandatory structure to normalize orchestration tasks
const contextRequirementAnalysisOutputFormat = {
  classification: "",      // e.g., SIMPLE_QUERY, PROJECT_SPECIFIC
  needsContext: false,     // true/false
  requiredTools: []        // list of tools needed
};

//3. examples

const contextRequirementAnalysisExamples = {
  
}

//ANALYZER TRIGGER FUNCTION
function contextRequirementAnalysis (query){
  // Analyze the query to determine what context is needed
  // This function would parse the query and identify key elements
  // such as entities, relationships, and intent.
  const prompt = `
   You are an expert at analyzing user queries to determine context requirements.
   Read all of these steps below to perform the analysis - FOLLOW THEM CAREFULLY!:
   1. Understand the tools given to you for to help analyze -> GIVEN_TOOLS: ${contextRequirementAnalysisTools}.
   2. You are given classifications to normalize your analysis across different queries. *YOU MUST PICK ONE OF THESE* -> CLASSIFICATION_CATEGORIES: ${contextRequirementAnalysisClassifications}.
   3. Understand the following desired OUTPUT_FORMAT. Your final output should be formatted EXACTLY as shown here -> DESIRED_OUTPUT_FORMAT : ${contextRequirementAnalysisOutputFormat}.
   4. Here are some examples for you to look at to help establish your role -> Examples : ${contextRequirementAnalysisExamples}
   4. Analyze the following query and identify the context requirements, then pick from the classification categories and format your output as specified.
   QUERY: ${query}
   5. Return your analysis in the desired output format.
  `
}

