import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Status Bar Store
 * Manages real-time status information displayed in the status bar
 */

/**
 * @typedef {Object} ConnectionStatus
 * @property {'connected' | 'connecting' | 'disconnected' | 'error'} state
 * @property {number} lastConnected - Timestamp of last successful connection
 * @property {string} error - Error message if any
 */

/**
 * @typedef {Object} ConnectionInfo
 * @property {'connected' | 'connecting' | 'disconnected' | 'error'} state
 * @property {string} name - Connection name (e.g., 'WebSocket', 'Database', 'Embedding Pipeline')
 * @property {string} error - Error message if any
 */

/**
 * @typedef {Object} ErrorEntry
 * @property {string} id - Unique error ID
 * @property {'error' | 'warning'} severity - Error severity
 * @property {string} message - Error message
 * @property {string} source - Error source (e.g., 'Database', 'Embedding Pipeline', 'WebSocket')
 * @property {number} timestamp - Error timestamp
 * @property {string} details - Optional error details
 */

/**
 * @typedef {Object} ActionStatus
 * @property {'idle' | 'saving' | 'success' | 'error'} state
 * @property {string} actionId - Unique action ID
 * @property {number} startTime - When action started
 * @property {string} error - Error message if failed
 */

/**
 * @typedef {Object} FileStatus
 * @property {string} path - Current file path
 * @property {string} name - Current file name
 * @property {string} language - File language/mode
 * @property {number} lineCount - Total lines in file
 */

/**
 * @typedef {Object} CursorStatus
 * @property {number} line - Current line (1-indexed)
 * @property {number} column - Current column (1-indexed)
 * @property {number} selectionLength - Length of selection (0 if no selection)
 */

const useStatusBarStore = create(
  devtools(
    (set, get) => ({
      // Connection statuses (multiple connections)
      connections: {
        websocket: {
          state: 'disconnected',
          name: 'WebSocket',
          error: null,
        },
        database: {
          state: 'disconnected',
          name: 'Database',
          error: null,
        },
        embeddingPipeline: {
          state: 'disconnected',
          name: 'Embedding Pipeline',
          error: null,
        },
      },

      // Error tracking (VS Code style)
      errors: [], // Array of ErrorEntry

      // Action status (spinner/checkmark/X)
      actionStatus: {
        state: 'idle',
        actionId: null,
        startTime: null,
        error: null,
      },

      // File status
      file: null,

      // Cursor status
      cursor: null,

      // Actions
      setConnectionState: (connectionName, connectionState, error = null) =>
        set(
          (currentState) => ({
            connections: {
              ...currentState.connections,
              [connectionName]: {
                ...currentState.connections[connectionName],
                state: connectionState,
                error,
              },
            },
          }),
          false,
          `setConnectionState:${connectionName}`
        ),

      // Error management
      addError: (severity, message, source, details = null) => {
        const error = {
          id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          severity, // 'error' or 'warning'
          message,
          source,
          timestamp: Date.now(),
          details,
        };

        set(
          (state) => ({
            errors: [...state.errors, error].slice(-50), // Keep last 50 errors
          }),
          false,
          'addError'
        );

        return error.id;
      },

      removeError: (id) =>
        set(
          (state) => ({
            errors: state.errors.filter((e) => e.id !== id),
          }),
          false,
          'removeError'
        ),

      clearErrors: (source = null) =>
        set(
          (state) => ({
            errors: source
              ? state.errors.filter((e) => e.source !== source)
              : [],
          }),
          false,
          'clearErrors'
        ),

      getErrorCount: () => {
        const state = get();
        return {
          errors: state.errors.filter((e) => e.severity === 'error').length,
          warnings: state.errors.filter((e) => e.severity === 'warning').length,
        };
      },

      // Action status management
      startAction: (actionId = null) => {
        const id = actionId || `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set(
          {
            actionStatus: {
              state: 'saving',
              actionId: id,
              startTime: Date.now(),
              error: null,
            },
          },
          false,
          'startAction'
        );
        return id;
      },

      completeAction: (success = true, error = null) => {
        const currentStatus = get().actionStatus;
        if (currentStatus.state !== 'saving') return;

        set(
          {
            actionStatus: {
              ...currentStatus,
              state: success ? 'success' : 'error',
              error,
            },
          },
          false,
          'completeAction'
        );

        // Auto-clear after showing result
        setTimeout(() => {
          set(
            (state) => {
              // Only clear if this is still the same action
              if (state.actionStatus.actionId === currentStatus.actionId) {
                return {
                  actionStatus: {
                    state: 'idle',
                    actionId: null,
                    startTime: null,
                    error: null,
                  },
                };
              }
              return state;
            },
            false,
            'clearActionStatus'
          );
        }, 2000); // Show checkmark/X for 2 seconds

        // If error, add to error list
        if (!success && error) {
          get().addError('error', error, 'Save Pipeline');
        }
      },

      clearActionStatus: () =>
        set(
          {
            actionStatus: {
              state: 'idle',
              actionId: null,
              startTime: null,
              error: null,
            },
          },
          false,
          'clearActionStatus'
        ),

      setFileStatus: (fileStatus) =>
        set({ file: fileStatus }, false, 'setFileStatus'),

      clearFileStatus: () =>
        set({ file: null }, false, 'clearFileStatus'),

      setCursorStatus: (cursorStatus) =>
        set({ cursor: cursorStatus }, false, 'setCursorStatus'),

      clearCursorStatus: () =>
        set({ cursor: null }, false, 'clearCursorStatus'),

      clearAllStatus: () =>
        set(
          {
            file: null,
            cursor: null,
            errors: [],
            actionStatus: {
              state: 'idle',
              actionId: null,
              startTime: null,
              error: null,
            },
          },
          false,
          'clearAllStatus'
        ),
    }),
    { name: 'StatusBarStore' }
  )
);

export default useStatusBarStore;

