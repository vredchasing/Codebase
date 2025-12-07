-Misc
  - API usage tracker/logger
  - Address users bypassing free trial limits (1 per person)
  -Redis integration for better persistent state management for backend + frontend. Use RedisJSON for performance boost on JSON reads.
    -Cache AST trees on demand via Redis to support lots of concurrent users (6 figure+ active users)
  -Embedding updates can be offloaded to a queue (e.g., RabbitMQ, BullMQ).
  -Firecracker VM support
    - Sandbox users workspace via VMs
    - Address code execution security risks
  - Electron build for desktop app
  - Create analytics/logging/admin system for application insights/performance/errors
  - Improve logging and analysis across the app 

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



-Notes
  -AST update flow
    -debounced save → update persistent storage → trigger pipeline → incremental parse → embeddings → update session cache


  Embedding Pipeline Optimization->
  1. We must design a more robust embedding design to account for ALL edge cases of real world application scenarios. We use this design in our AST update pipeline as well (we dont want to flag nodes for embedding if they dont match our embedding schema/design)
  Current implementation is triggering our pipeline without needing to, our pipeline is so that our LLM RAG system has access to the latest updates in the codespace, however CODEBASE is also a code editor, not just an agent, therefore we need to design with the fact in mind, that not every user will use the model all the time, sometimes they might just work in the editor for periods of time.
  We need to design the pipeline so that we don't actually trigger unnecessary DB/Cache read and writes if it is not needed. TTL- Create an on demmand pipeline.

  Currently, each changed chunk triggers: insert embedding → update chunk meta.

  Batching: Send multiple chunks per API call to OpenAI embeddings. Reduces network overhead.

  Async write-back: Only update DB after embeddings are returned. Good. Consider bulk upserts instead of per-chunk queries.

  Versioning chunks: Store a chunk_version to avoid re-embedding already processed content.


  Prometheus



  metadata, embedding 