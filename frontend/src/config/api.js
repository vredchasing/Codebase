/**
 * API Configuration
 * Centralized API endpoint configuration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    GET_USER: `${API_BASE_URL}/api/auth/getUser`,
  },
  DASHBOARD: {
    GET_PROJECTS: `${API_BASE_URL}/api/dashboard/get-user-projects`,
    GET_COLLECTIONS: `${API_BASE_URL}/api/collections/get-user-collections`,
  },
  PROJECTS: {
    BASE: `${API_BASE_URL}/api/projects`,
    CREATE: `${API_BASE_URL}/api/projects/create-project`,
    GET_PROJECT: (projectId) => `${API_BASE_URL}/api/projects/get-project/${projectId}`,
    GET_WORKSPACE_UI_STATE: (projectId) => `${API_BASE_URL}/api/projects/get-workspace-ui-state/${projectId}`,
    GET_FILE_TREE_CONTENT: `${API_BASE_URL}/api/projects/get-file-tree-content`,
    UPDATE_FILE: `${API_BASE_URL}/api/projects/updateFile`,
    FILES: {
      BASE: `${API_BASE_URL}/api/projects/files`,
      CREATE: `${API_BASE_URL}/api/projects/files/file-folder-creation`,
    },
  },
  AGENT: {
    STREAM: `${API_BASE_URL}/api/agent/stream`,
  },
};

export default API_BASE_URL;

