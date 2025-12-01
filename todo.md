-Misc
  - API usage tracker/logger
  - Address users bypassing free trial limits (1 per person)
  -Redis integration for better persistent state management for backend + frontend
  -Firecracker VM support
    - Sandbox users workspace via VMs
    - Address code execution security risks
  - Electron build for desktop app
  - Create analytics/logging/admin system for application insights/performance/errors

-Frontend/UI
  -LandingPage
    1. Finish UI design
  -Login/Signup.jsx
    1. Update UI design
  -Dashboard.jsx
    1. Update UI design
  -KiraWorkspace.jsx
    1. Polish chat UI
    2. Add more utility
    3. Indexing/cache indicators + reindex button for manual reindex

-Backend
  - tree-sitter
    - multi-language support
    - treeSitterServices.js
      1. batch AST incremntal updates for performance upgrade
      2. Reindex feature which reindexes the whole project in the case of indexing errors, or imported projects from github/disk
  - RAG engine
    1. improve model capabilties via more model tools i.e. grep (regex based keyword search) etc...
    2. create a central prompt file to plug prompts in depending on which prompt is needed
    3. refactor tool using dependency graphs for a more robust refactoring agent, ensuring the models have the full dependency graph to avoid bad refactors that end up breaking code
    4. BugBot -> build a more robust agent error checker by allowing the engine to exectute the code, read console errors etc...

-Database
  1. Redesign database schemas for a more organized database
