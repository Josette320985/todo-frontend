import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

/**
 * Custom DOM event name dispatched when an authenticated API request
 * fails with HTTP 401 Unauthorized (expired or invalid JWT).
 */
export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized' as const;

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

/**
 * Intercepts incoming HTTP responses to handle expired or revoked tokens.
 *
 * When a non-login endpoint returns HTTP 401 Unauthorized, removes the
 * stored JWT from localStorage and notifies the application to log out.
 */
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError): Promise<never> => {
    const requestUrl: string = error.config?.url ?? '';
    if (
      error.response?.status === 401 &&
      !requestUrl.includes('/auth/login')
    ) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

export default api;
