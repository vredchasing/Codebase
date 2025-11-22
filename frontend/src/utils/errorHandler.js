/**
 * Error Handling Utilities
 * Provides consistent error handling patterns
 */

/**
 * Extract user-friendly error message from error object
 * @param {Error|object} error - Error object
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error) {
  if (!error) {
    return 'An unexpected error occurred';
  }

  // Axios error
  if (error.response) {
    const { status, data } = error.response;
    
    // Check if server provided a message
    if (data?.message) {
      return data.message;
    }
    
    // Default messages by status code
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'You are not authorized. Please log in.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This resource already exists.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return `Error ${status}: Something went wrong.`;
    }
  }
  
  // Network error
  if (error.request) {
    return 'Network error. Please check your connection.';
  }
  
  // Generic error
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Handle API error with logging and user notification
 * @param {Error|object} error - Error object
 * @param {string} context - Context where error occurred (e.g., 'Login', 'File Upload')
 * @param {Function} [onError] - Optional callback for custom error handling
 * @returns {string} User-friendly error message
 */
export function handleError(error, context = 'Operation', onError = null) {
  const message = getErrorMessage(error);
  
  // Log error for debugging
  console.error(`[${context}] Error:`, {
    message,
    error,
    timestamp: new Date().toISOString(),
  });
  
  // Call custom error handler if provided
  if (onError && typeof onError === 'function') {
    onError(message, error);
  }
  
  return message;
}

/**
 * Create error handler for async functions
 * @param {Function} asyncFn - Async function to wrap
 * @param {string} context - Context for error messages
 * @param {Function} [onError] - Optional error callback
 * @returns {Function} Wrapped function with error handling
 */
export function withErrorHandling(asyncFn, context, onError = null) {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      handleError(error, context, onError);
      throw error; // Re-throw so caller can handle if needed
    }
  };
}

