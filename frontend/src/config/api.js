/**
 * API Endpoints Configuration
 * Centralized definition of all API endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    GET_USER: `${API_BASE_URL}/api/auth/getUser`,
  },

  // Dashboard endpoints
  DASHBOARD: {
    GET_PROJECTS: `${API_BASE_URL}/api/dashboard/get-user-projects`,
    // GET_COLLECTIONS endpoint does not exist in backend yet
  },

  // Project endpoints
  PROJECTS: {
    CREATE: `${API_BASE_URL}/api/projects/create-project`,
    GET_PROJECT: (projectId) => `${API_BASE_URL}/api/projects/get-project/${projectId}`,
    GET_WORKSPACE_UI_STATE: (projectId) => `${API_BASE_URL}/api/projects/get-workspace-ui-state/${projectId}`,
    GET_FILE_TREE_CONTENT: `${API_BASE_URL}/api/projects/get-file-tree-content`,
    UPDATE_FILE: `${API_BASE_URL}/api/projects/updateFile`,
    FILES: {
      CREATE: `${API_BASE_URL}/api/projects/files/create`,
      UPDATE: `${API_BASE_URL}/api/projects/files/update`,
      DELETE: `${API_BASE_URL}/api/projects/files/delete`,
    },
  },

  // Agent endpoints
  AGENT: {
    STREAM: `${API_BASE_URL}/api/agent/stream`,
  },

  // Chat endpoints
  CHAT: {
    SESSIONS: {
      CREATE: `${API_BASE_URL}/api/chat/sessions`,
      GET_ALL: `${API_BASE_URL}/api/chat/sessions`,
      GET_ONE: (sessionId) => `${API_BASE_URL}/api/chat/sessions/${sessionId}`,
      UPDATE: (sessionId) => `${API_BASE_URL}/api/chat/sessions/${sessionId}`,
    },
    MESSAGES: {
      CREATE: (sessionId) => `${API_BASE_URL}/api/chat/sessions/${sessionId}/messages`,
      GET: (sessionId) => `${API_BASE_URL}/api/chat/sessions/${sessionId}/messages`,
      GET_LLM: (sessionId) => `${API_BASE_URL}/api/chat/sessions/${sessionId}/messages/llm`,
    },
    STATS: {
      GET: (sessionId) => `${API_BASE_URL}/api/chat/sessions/${sessionId}/stats`,
    },
  },
};

export default API_ENDPOINTS;
