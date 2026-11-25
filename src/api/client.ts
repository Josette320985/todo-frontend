import { getToken, clearToken } from './token';
import { record } from './errors';

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized' as const;
export const REQUEST_TIMEOUT_MS = 10_000;
interface Options { signal?: AbortSignal }
export class ApiFailure extends Error {
  constructor(
    public readonly kind: 'http' | 'network' | 'timeout' | 'cancelled' | 'invalid_response',
    public readonly status?: number,
    public readonly detail?: unknown,
    public readonly errors?: unknown,
    public readonly retryAfter?: string | null,
    public readonly code?: string,
  ) { super(kind); this.name = 'ApiFailure'; }
}

async function request<T>(method: string, path: string, body?: unknown, options: Options = {}): Promise<{ data: T }> {
  if (!path.startsWith('/v1/') || path.includes('://')) throw new Error('Invalid API path');
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let payload: BodyInit | undefined;
  if (body instanceof URLSearchParams) {
    headers.set('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
    payload = body.toString();
  } else if (body !== undefined) {
    headers.set('Content-Type', 'application/json'); payload = JSON.stringify(body);
  }
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = options.signal ? AbortSignal.any([timeout, options.signal]) : timeout;
  try {
    const response = await fetch(`/api${path}`, { method, headers, body: payload, signal, credentials: 'omit' });
    if (response.status === 401 && path.split('?')[0] !== '/v1/auth/login' && getToken() === token) {
      clearToken(); window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
      const response = await fetch(`/api${path}`, { method, headers, body: payload, signal, credentials: 'include' });
      const endpoint = path.split('?')[0];
      if (response.status === 401 && endpoint !== '/v1/auth/login' && endpoint !== '/v1/auth/me') {
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
      }
      const text = response.status === 204 ? '' : await response.text();
      let data: unknown;
      try { data = text ? JSON.parse(text) : undefined; }
      catch { if (response.ok) throw new ApiFailure('invalid_response', response.status); }
      if (!response.ok) {
        const parsed = record(data);
        throw new ApiFailure('http', response.status, parsed.detail, parsed.errors, response.headers.get('Retry-After'),
          typeof parsed.code === 'string' ? parsed.code : undefined);
      }
      return { data: data as T };
    } catch (error) {
      if (error instanceof ApiFailure) throw error;
      if (signal.aborted) throw new ApiFailure(options.signal?.aborted ? 'cancelled' : 'timeout');
      throw new ApiFailure('network');
    }
  }

export default {
    get: <T>(path: string, options?: Options) => request<T>('GET', path, undefined, options),
    post: <T = void>(path: string, body?: unknown, options?: Options) => request<T>('POST', path, body, options),
    put: <T>(path: string, body?: unknown, options?: Options) => request<T>('PUT', path, body, options),
    delete: (path: string, options?: Options) => request<void>('DELETE', path, undefined, options),
  };
