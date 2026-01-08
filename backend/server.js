import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import signUpRouter from './src/auth/signup.js';
import loginRouter from './src/auth/login.js';
import getUserRouter from './src/auth/getUser.js';
import getUserProjectsRouter from './src/routes/projects/getUserProjects.js'
import projectRouter from './src/routes/projects/projectRoutes.js'
import fileOrFolderCreation from './src/routes/fileExplorerRoutes/fileExplorerRoutes.js'

import agentRoutes from './src/routes/agentRoutes/agentRoutes.js';
import chatRoutes from './src/routes/agentRoutes/chatRoutes/chatRoutes.js';
import cookieParser from 'cookie-parser';
import { config } from './src/config/index.js';
import { createWSServer } from './websocket.js';
import { setWSServer } from './websocketInstance.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors(config.cors));

// mount your auth routes (assuming prefix /api/auth)
app.use('/api/auth', signUpRouter);
app.use('/api/auth', loginRouter);
app.use('/api/auth', getUserRouter);
app.use('/api/dashboard', getUserProjectsRouter)
app.use('/api/projects', projectRouter)
app.use('/api/projects/files', fileOrFolderCreation)
app.use('/api/agent', agentRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 3000;

// Create HTTP server and attach WebSocket server
const httpServer = createServer(app);
const wsServer = createWSServer(httpServer);

// Set wsServer instance for use in other modules
setWSServer(wsServer);

// Export wsServer for use in other modules
export { wsServer };

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}/ws`);
});
