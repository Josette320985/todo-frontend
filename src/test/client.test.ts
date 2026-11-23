import { expect, it, vi, afterEach } from 'vitest';
import api, { AUTH_UNAUTHORIZED_EVENT, ApiFailure } from '../api/client';
import { setToken, getToken } from '../api/token';
import { getApiError } from '../api/errors';
const mockFetch = vi.fn();
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function respond(body: unknown, status = 200, headers = {}) {
  vi.stubGlobal('fetch', mockFetch.mockResolvedValue(new Response(status === 204 ? null : JSON.stringify(body), { status, headers })));
}
it('distinguishes a proxy outage from backend failures across the transport', async () => {
  respond({ code: 'upstream_unavailable' }, 503);
  const unavailable = await api.post('/v1/tasks/', {}).catch(getApiError);
  expect(unavailable).toMatchObject({ status: 503, message: 'No hay conexión con el servidor. Revisa tu internet.' });
  respond({ code: 'service_unavailable' }, 503);
  expect(await api.post('/v1/tasks/', {}).catch(getApiError)).toMatchObject({ message: 'Algo falló en el servidor. Intenta de nuevo en un momento.' });
  respond({ code: 'internal_error' }, 500);
  expect(await api.post('/v1/tasks/', {}).catch(getApiError)).toMatchObject({ message: 'Algo falló en el servidor. Intenta de nuevo en un momento.' });
});
it('sends JSON and Authorization without storing request secrets on failures', async () => {
  setToken('SECRET'); respond({ detail: 'No' }, 500);
  const error = await api.post('/v1/tasks/', { title: 'Tarea' }).catch(e => e);
  expect(error).toBeInstanceOf(ApiFailure);
  expect(JSON.stringify(error)).not.toContain('SECRET');
  expect(mockFetch.mock.calls.at(-1)?.[0]).toBe('/api/v1/tasks/');
  expect(mockFetch.mock.calls.at(-1)?.[1].headers.get('Authorization')).toBe('Bearer SECRET');
});
it('encodes login form, reads JSON, and handles empty 204', async () => {
  respond({ access_token: 'token' });
  expect((await api.post('/v1/auth/login', new URLSearchParams({ username: 'a+b@example.com', password: 'test' }))).data).toEqual({ access_token: 'token' });
  expect(mockFetch.mock.calls.at(-1)?.[1].body).toContain('a%2Bb%40example.com');
  respond(null, 204); expect((await api.delete('/v1/tasks/1')).data).toBeUndefined();
});
it('clears protected 401 but excludes login and stale sessions', async () => {
  const spy = vi.fn(); window.addEventListener(AUTH_UNAUTHORIZED_EVENT, spy);
  try {
    setToken('a'); respond({}, 401);
    await expect(api.get('/v1/tasks/')).rejects.toMatchObject({ status: 401 });
    expect(getToken()).toBeNull(); expect(spy).toHaveBeenCalledTimes(1);
    setToken('b'); await api.post('/v1/auth/login').catch(() => {});
    expect(getToken()).toBe('b'); expect(spy).toHaveBeenCalledTimes(1);
    vi.stubGlobal('fetch', vi.fn(async () => { setToken('new'); return new Response('{}', { status: 401 }); }));
    await api.get('/v1/tasks/').catch(() => {}); expect(getToken()).toBe('new');
  } finally { window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, spy); }
});
it('retains Retry-After and validation fields', async () => {
  respond({ detail: 'Límite' }, 429, { 'Retry-After': '42' });
  await expect(api.get('/v1/tasks/')).rejects.toMatchObject({ retryAfter: '42', status: 429 });
  respond({ errors: [{ field: 'title', message: 'Obligatorio' }] }, 422);
  await expect(api.post('/v1/tasks/', {})).rejects.toMatchObject({ errors: [{ field: 'title', message: 'Obligatorio' }] });
});
it('distinguishes network, timeout, cancellation and malformed success', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')));
  await expect(api.get('/v1/tasks/')).rejects.toMatchObject({ kind: 'network' });
  const timeout = new AbortController();
  const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeout.signal);
  vi.stubGlobal('fetch', vi.fn((_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))))));
  const pending = api.get('/v1/tasks/'); const assertion = expect(pending).rejects.toMatchObject({ kind: 'timeout' });
  expect(timeoutSpy).toHaveBeenCalledWith(10_000); timeout.abort(); await assertion;
  const cancel = new AbortController(); cancel.abort();
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')));
  await expect(api.get('/v1/tasks/', { signal: cancel.signal })).rejects.toMatchObject({ kind: 'cancelled' });
  timeoutSpy.mockRestore();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json')));
  await expect(api.get('/v1/tasks/')).rejects.toMatchObject({ kind: 'invalid_response' });
});
