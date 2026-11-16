import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

/**
 * Creates a reusable Axios instance for communicating with the backend API.
 * All requests use '/api' as the base URL.
 */
const api: AxiosInstance = axios.create({
  baseURL: '/api',
});

/**
 * Intercepts outgoing HTTP requests to attach the authentication token.
 *
 * Retrieves the JWT token from localStorage and, if available,
 * adds it to the Authorization header using the Bearer scheme.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token: string | null = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
);

export default api;
