// frontend/src/services/api.js

import axios from 'axios';

// Make sure this matches your Django backend URL
const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// --- Define Public Endpoints ---
// Add all API endpoints that should NOT have an Authorization header
const PUBLIC_ENDPOINTS = [
  '/auth/login/',
  '/auth/faculty-register/',
  '/auth/verify-email/', // Both GET (if using path tokens) and POST (body tokens) should ideally be public
  // Add other public endpoints here if you have any (e.g., public stats, password reset request)
];

/**
 * Checks if a given URL config corresponds to a public endpoint.
 * @param {Object} config - The Axios request config object.
 * @returns {boolean} True if the endpoint is public, false otherwise.
 */
const isPublicEndpoint = (config) => {
  try {
    // Resolve the full URL relative to the baseURL to get the path
    const url = new URL(config.url, config.baseURL || API_BASE_URL);
    const pathname = url.pathname;

    // Check if the pathname ends with any of the defined public endpoints
    // Using endsWith makes it robust against potential trailing slashes or base API path prefixes
    return PUBLIC_ENDPOINTS.some(endpoint => pathname.endsWith(endpoint));
  } catch (e) {
    // If URL construction fails, assume it's not public for safety
    console.error("Error determining if endpoint is public:", e);
    return false;
  }
};
// --- End Define Public Endpoints ---

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Only add the Authorization header if:
    // 1. It's NOT a designated public endpoint, AND
    // 2. A token exists in localStorage
    if (!isPublicEndpoint(config)) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Token ${token}`;
      }
      // If no token exists for a non-public endpoint, the request will likely fail
      // with 401/403, which is the expected behavior.
    }
    // If it IS a public endpoint, do NOT add the Authorization header.
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (optional) for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors globally if needed
    if (error.response?.status === 401) {
      // Potentially trigger logout if token is invalid
      // This is handled in AuthContext for login check, but can be centralized here too
      console.log("Unauthorized access - token might be invalid");
      // Example: You could call a logout function here if needed globally
      // logoutFunctionFromContextOrStore();
    }
    return Promise.reject(error);
  }
);

export default api;