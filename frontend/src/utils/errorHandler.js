/**
 * Error Handling Utilities
 * Provides consistent error handling across the application
 */

/**
 * Extract a user-friendly error message from an error object
 * Handles various error formats (Axios errors, standard errors, etc.)
 * 
 * @param {Error|Object} error - The error object
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (!error) {
    return 'An unexpected error occurred';
  }

  // Axios error with response data
  if (error.response?.data) {
    const data = error.response.data;
    
    // Check for message in various formats
    if (data.message) {
      return data.message;
    }
    if (data.error) {
      return data.error;
    }
    if (data.msg) {
      return data.msg;
    }
    if (typeof data === 'string') {
      return data;
    }
    
    // Fallback to status text
    return error.response.statusText || `Server error (${error.response.status})`;
  }

  // Axios error without response (network error, timeout, etc.)
  if (error.request) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
    if (error.message?.includes('Network Error')) {
      return 'Network error. Please check your connection and try again.';
    }
    return 'Unable to connect to server. Please try again later.';
  }

  // Standard Error object
  if (error.message) {
    return error.message;
  }

  // String error
  if (typeof error === 'string') {
    return error;
  }

  // Unknown error format
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Handle errors with logging and optional callback
 * 
 * @param {Error|Object} error - The error object
 * @param {string} context - Context where the error occurred (e.g., 'Login', 'ProjectCreator')
 * @param {Function} [callback] - Optional callback function to handle the error message
 * @returns {string} The error message
 * 
 * @example
 * try {
 *   await api.post(url, data);
 * } catch (error) {
 *   const errorMessage = handleError(error, 'ComponentName', (msg) => {
 *     setErrors({ submit: msg });
 *   });
 * }
 */
export const handleError = (error, context, callback) => {
  const errorMessage = getErrorMessage(error);
  
  // Log error with context for debugging
  console.error(`[${context}] Error:`, {
    message: errorMessage,
    error: error.response?.data || error.message || error,
    status: error.response?.status,
    url: error.config?.url,
  });

  // Execute callback if provided
  if (typeof callback === 'function') {
    callback(errorMessage);
  }

  return errorMessage;
};

/**
 * Wrap a function with error handling
 * Useful for async functions that need consistent error handling
 * 
 * @param {Function} fn - The function to wrap
 * @param {string} context - Context for error logging
 * @param {Function} [errorCallback] - Optional callback for error handling
 * @returns {Function} Wrapped function with error handling
 * 
 * @example
 * const safeFetchData = withErrorHandling(
 *   async () => {
 *     const response = await api.get(url);
 *     return response.data;
 *   },
 *   'DataFetcher',
 *   (errorMessage) => {
 *     setError(errorMessage);
 *   }
 * );
 * 
 * // Usage
 * const data = await safeFetchData();
 */
export const withErrorHandling = (fn, context, errorCallback) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context, errorCallback);
      throw error; // Re-throw to allow caller to handle if needed
    }
  };
};

