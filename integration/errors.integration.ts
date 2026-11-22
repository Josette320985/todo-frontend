import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import api from '../src/api/client';
import { getApiError } from '../src/api/errors';
import * as auth from '../src/api/auth';
import { validatePassword, validateTitle } from '../src/lib/validation';
import { validateDates } from '../src/lib/dates';
import type { Task } from '../src/types/task';

const base = 'http://127.0.0.1:8011';
const nativeFetch = globalThis.fetch;
const storage = new Map<string, string>();
const email = `qa-errors-${Date.now()}@example.com`;
const password = 'á'.repeat(35) + 'a1'; // 72 UTF-8 bytes, accepted by both layers.

beforeAll(async () => {
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('fetch', (path: string, init?: RequestInit) => nativeFetch(`${base}${path}`, init));
  expect(validatePassword(password)).toBe('');
  await auth.register({ email, password });
  await auth.login(email, password);
});
afterAll(() => vi.unstubAllGlobals());

it('accepts form boundary values against the actual schemas', async () => {
  const title = 'a'.repeat(200);
  expect(validateTitle(title)).toBe('');
  expect(validateDates('2024-02-29', '2024-03-01')).toBe('');
  const { data } = await api.post<Task>('/v1/tasks/', { title, start_date: '2024-02-29', end_date: '2024-03-01' });
  expect(data.title).toBe(title);
  await api.put(`/v1/tasks/${data.id}`, { description: 'd'.repeat(1000) });
  await api.delete(`/v1/tasks/${data.id}`);
  const missing = await api.put(`/v1/tasks/${data.id}`, { title: 'Cambio' }).catch(error => getApiError(error));
  expect(missing).toMatchObject({ status: 404, message: 'Esta tarea ya no existe' });
});

it('maps actual ERR-02 date and title errors into their fields', async () => {
  for (const [body, field] of [
    [{ title: 'x'.repeat(201) }, 'title'],
    [{ title: 'Fechas', start_date: '2026-11-22', end_date: '2026-11-21' }, 'end_date'],
  ] as const) {
    const result = await api.post('/v1/tasks/', body).catch(error => getApiError(error));
    expect(result).toMatchObject({ status: 422, fieldErrors: { [field]: expect.any(String) } });
  }
});

it('maps actual registration validation errors without leaking request data', async () => {
  const result = await auth.register({ email: 'invalid', password: 'short' }).catch(error => getApiError(error));
  expect(result).toMatchObject({ status: 422, fieldErrors: { email: expect.any(String), password: expect.any(String) } });
  expect(JSON.stringify(result)).not.toContain('short');
});

it('handles the real 429 and reports whether ERR-03 is available', async () => {
  let limited;
  for (let attempt = 0; attempt < 12; attempt++) {
    const result = await auth.login(`missing-${Date.now()}@example.com`, 'WrongPassword1').catch(error => getApiError(error));
    if (result?.status === 429) { limited = result; break; }
  }
  expect(limited?.message).toContain('Demasiados intentos');
  if (limited?.retryAfter === undefined) {
    console.info('DEPENDENCIA PENDIENTE: ERR-03; el backend no devuelve Retry-After en 429.');
  } else {
    expect(limited.retryAfter).toBeGreaterThanOrEqual(0);
  }
});
