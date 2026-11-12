
import axios from 'axios';

/**
 * Creates a reusable Axios instance for communicating with the backend API.
 * All requests use '/api' as the base URL.
 */
const api = axios.create({
  baseURL: '/api',
});

/**
 * Intercepts outgoing HTTP requests to attach the authentication token.
 *
 * Retrieves the JWT token from localStorage and, if available,
 * adds it to the Authorization header using the Bearer scheme.
 *
 * @param {import('axios').InternalAxiosRequestConfig} config
 *   - The outgoing Axios request configuration.
 * @returns {import('axios').InternalAxiosRequestConfig}
 *   The request configuration with the Authorization header,
 *   if a token exists.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
