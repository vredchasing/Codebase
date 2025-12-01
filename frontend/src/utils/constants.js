/**
 * Application Constants
 * Centralized constants for consistent usage across the app
 */

/**
 * Task Complexity Levels
 */
export const COMPLEXITY = {
  SIMPLE: '1',
  MEDIUM: '2',
  COMPLEX: '3',
};

/**
 * User Roles (if applicable)
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
};

/**
 * File Types
 */
export const FILE_TYPES = {
  FILE: 'file',
  FOLDER: 'folder',
};

/**
 * Node Types
 */
export const NODE_TYPES = {
  FILE: 'file',
  FOLDER: 'folder',
};

/**
 * API Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Validation Rules
 */
export const VALIDATION_RULES = {
  EMAIL: {
    required: true,
    email: true,
  },
  PASSWORD: {
    required: true,
    minLength: 8,
  },
  NAME: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
};

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
};

/**
 * Route Paths
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  WORKSPACE: '/workspace',
  CREATE_PROJECT: '/create-project',
  KIRA: '/kira',
};

/**
 * Component States
 */
export const COMPONENT_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * Message Roles (for chat/agent)
 */
export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
};









