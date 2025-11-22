/**
 * Centralized API Client
 * Provides consistent axios configuration and error handling
 */

import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (for adding auth tokens, etc.)
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens or headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (for handling errors globally)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors globally
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - could redirect to login
          console.error('Unauthorized access');
          break;
        case 403:
          console.error('Forbidden access');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error(`API Error: ${status}`, data);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network error - no response from server');
    } else {
      // Error setting up request
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * API helper functions
 */
export const api = {
  /**
   * GET request
   * @param {string} url - Endpoint URL
   * @param {object} config - Axios config
   * @returns {Promise} Axios response
   */
  get: (url, config = {}) => apiClient.get(url, config),

  /**
   * POST request
   * @param {string} url - Endpoint URL
   * @param {object} data - Request body
   * @param {object} config - Axios config
   * @returns {Promise} Axios response
   */
  post: (url, data, config = {}) => apiClient.post(url, data, config),

  /**
   * PUT request
   * @param {string} url - Endpoint URL
   * @param {object} data - Request body
   * @param {object} config - Axios config
   * @returns {Promise} Axios response
   */
  put: (url, data, config = {}) => apiClient.put(url, data, config),

  /**
   * PATCH request
   * @param {string} url - Endpoint URL
   * @param {object} data - Request body
   * @param {object} config - Axios config
   * @returns {Promise} Axios response
   */
  patch: (url, data, config = {}) => apiClient.patch(url, data, config),

  /**
   * DELETE request
   * @param {string} url - Endpoint URL
   * @param {object} config - Axios config
   * @returns {Promise} Axios response
   */
  delete: (url, config = {}) => apiClient.delete(url, config),
};

// Export endpoints for convenience
export { API_ENDPOINTS };

export default apiClient;

