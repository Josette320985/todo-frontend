import { createServer, type IncomingMessage, type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import api from '../src/api/client';
import { getApiError } from '../src/api/errors';
import * as auth from '../src/api/auth';
import { validatePassword, validateTitle } from '../src/lib/validation';
import { validateDates } from '../src/lib/dates';
import type { Task } from '../src/types/task';

const nativeFetch = globalThis.fetch;
const storage = new Map<string, string>();
const email = `qa-errors-${Date.now()}@example.com`;
const password = 'á'.repeat(35) + 'a1'; // 72 UTF-8 bytes, accepted by both layers.

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on('data', chunk => chunks.push(Buffer.from(chunk)));
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

function createContractServer() {
  const users = new Map<string, string>();
  const tasks = new Map<number, Task>();
  const loginAttempts = new Map<string, number>();
  let nextTaskId = 1;
  const token = 'integration-test-token';

  return createServer(async (request, response) => {
    const url = request.url ?? '';
    const method = request.method ?? 'GET';
    const rawBody = await readBody(request);
    const send = (status: number, body?: unknown, headers: Record<string, string> = {}) => {
      response.writeHead(status, {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      });
      response.end(body === undefined ? undefined : JSON.stringify(body));
    };

    if (method === 'POST' && url === '/api/v1/auth/register') {
      const payload = JSON.parse(rawBody) as { email?: string; password?: string };
      const errors: Array<{ field: string; message: string }> = [];
      if (!payload.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) {
        errors.push({ field: 'email', message: 'El email no es válido' });
      }
      const pw = payload.password ?? '';
      if (Array.from(pw).length < 8 || Buffer.byteLength(pw, 'utf8') > 72) {
        errors.push({ field: 'password', message: 'La contraseña no es válida' });
      }
      if (errors.length > 0) {
        send(422, { detail: 'Error de validación', errors });
        return;
      }
      users.set(payload.email!, pw);
      send(201, { id: 1, email: payload.email });
      return;
    }

    if (method === 'POST' && url === '/api/v1/auth/login') {
      const params = new URLSearchParams(rawBody);
      const username = params.get('username') ?? '';
      const pw = params.get('password') ?? '';
      const attempts = (loginAttempts.get(username) ?? 0) + 1;
      if (users.get(username) === pw) {
        loginAttempts.delete(username);
        send(200, { access_token: token, token_type: 'bearer' });
        return;
      }
      loginAttempts.set(username, attempts);
      if (attempts >= 5) {
        send(429, { detail: 'Demasiados intentos' }, { 'Retry-After': '30' });
        return;
      }
      send(401, { detail: 'Credenciales inválidas' });
      return;
    }

    if (request.headers.authorization !== `Bearer ${token}`) {
      send(401, { detail: 'No autorizado' });
      return;
    }

    if (method === 'POST' && url === '/api/v1/tasks/') {
      const payload = JSON.parse(rawBody) as {
        title?: string;
        description?: string | null;
        start_date?: string | null;
        end_date?: string | null;
      };
      const errors: Array<{ field: string; message: string }> = [];
      if (!payload.title || !payload.title.trim() || Array.from(payload.title).length > 200) {
        errors.push({ field: 'title', message: 'El título debe tener entre 1 y 200 caracteres' });
      }
      if (payload.start_date && payload.end_date && payload.end_date < payload.start_date) {
        errors.push({ field: 'body', message: 'La fecha de término no puede ser anterior a la fecha de inicio' });
      }
      if (errors.length > 0) {
        send(422, { detail: 'Error de validación', errors });
        return;
      }
      const task: Task = {
        id: nextTaskId++,
        title: payload.title!.trim(),
        description: payload.description ?? null,
        completed: false,
        start_date: payload.start_date ?? null,
        end_date: payload.end_date ?? null,
      };
      tasks.set(task.id, task);
      send(201, task);
      return;
    }

    const taskMatch = url.match(/^\/api\/v1\/tasks\/(\d+)$/);
    if (taskMatch) {
      const id = Number(taskMatch[1]);
      const existing = tasks.get(id);
      if (!existing) {
        send(404, { detail: 'Tarea no encontrada' });
        return;
      }
      if (method === 'PUT') {
        const payload = JSON.parse(rawBody) as Partial<Task>;
        if (payload.description && Array.from(payload.description).length > 1000) {
          send(422, { errors: [{ field: 'description', message: 'La descripción supera 1000 caracteres' }] });
          return;
        }
        const updated: Task = { ...existing, ...payload, id };
        tasks.set(id, updated);
        send(200, updated);
        return;
      }
      if (method === 'DELETE') {
        tasks.delete(id);
        send(204);
        return;
      }
    }

    send(404, { detail: 'Not found' });
  });
}

describe('API error and boundary integration (Vitest local contract server)', () => {
  let server: Server;

  beforeAll(async () => {
    server = createContractServer();
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing contract server port');
    const base = `http://127.0.0.1:${address.port}`;

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

  afterAll(async () => {
    vi.unstubAllGlobals();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });

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

  it('maps ERR-02 date and title errors into their fields', async () => {
    for (const [body, field] of [
      [{ title: 'x'.repeat(201) }, 'title'],
      [{ title: 'Fechas', start_date: '2026-11-22', end_date: '2026-11-21' }, 'end_date'],
    ] as const) {
      const result = await api.post('/v1/tasks/', body).catch(error => getApiError(error));
      expect(result).toMatchObject({ status: 422, fieldErrors: { [field]: expect.any(String) } });
    }
  });

  it('maps registration validation errors without leaking request data', async () => {
    const result = await auth.register({ email: 'invalid', password: 'short' }).catch(error => getApiError(error));
    expect(result).toMatchObject({ status: 422, fieldErrors: { email: expect.any(String), password: expect.any(String) } });
    expect(JSON.stringify(result)).not.toContain('short');
  });

  it('parses Retry-After delay on a 429 response', async () => {
    let limited;
    for (let attempt = 0; attempt < 12; attempt++) {
      const result = await auth.login('missing-err06@example.com', 'WrongPassword1').catch(error => getApiError(error));
      if (result?.status === 429) { limited = result; break; }
    }
    expect(limited?.status).toBe(429);
    expect(limited?.retryAfter).toBeGreaterThan(0);
    expect(limited?.retryAfter).toBeLessThanOrEqual(60);
    expect(limited?.message).toBe(`Demasiados intentos. Intenta en ${limited?.retryAfter} s`);
  });
});
