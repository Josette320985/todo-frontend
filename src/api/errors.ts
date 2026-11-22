import { TASK_LIMIT_MESSAGE } from '../lib/limits';

export interface ApiErrorInfo {
  message: string;
  fieldErrors: Record<string, string>;
  status?: number;
  retryAfter?: number;
}
export const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};

export function parseRetryAfter(value: unknown, now = Date.now()): number | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const numeric = Number(value);
  const seconds = String(value).trim() !== '' && Number.isFinite(numeric)
    ? numeric : (Date.parse(String(value)) - now) / 1000;
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : undefined;
}

/** Accept both legacy FastAPI details and the ERR-02 contract during rollout. */
export function getApiError(error: unknown): ApiErrorInfo {
  const err = record(error);
  const response = record(err.response);
  const data = 'data' in response ? record(response.data) : err;
  const rawStatus = response.status ?? err.status;
  const status = typeof rawStatus === 'number' ? rawStatus : undefined;
  const retryAfter = parseRetryAfter(err.retryAfter ?? record(response.headers)['retry-after']);
  const fieldErrors: Record<string, string> = {};
  const entries = Array.isArray(data.errors) ? data.errors : Array.isArray(data.detail) ? data.detail : [];
  for (const entry of entries) {
    const item = record(entry);
    const field = typeof item.field === 'string' ? item.field : Array.isArray(item.loc) ? item.loc.at(-1) : undefined;
    const message = item.message ?? item.msg;
    if (typeof field === 'string' && typeof message === 'string') {
      Object.defineProperty(fieldErrors, field, { value: message.replace(/^Value error,\s*/i, ''), enumerable: true, configurable: true });
    }
  }
  let message = typeof data.detail === 'string' && data.detail.trim()
    ? data.detail : Object.values(fieldErrors).join('. ') || 'No se pudo completar la solicitud.';
  if (err.kind === 'timeout' || err.code === 'ECONNABORTED' || err.name === 'TimeoutError') message = 'El servidor tardó demasiado. Intenta de nuevo.';
  else if (err.kind === 'cancelled') message = 'Solicitud cancelada.';
  else if (!status) message = 'No hay conexión con el servidor. Revisa tu internet.';
  else if (status === 404) message = 'Esta tarea ya no existe';
  // SEG-H12: the backend refused a new task because the user hit the cap.
  else if (status === 409 && data.code === 'task_limit_reached') message = TASK_LIMIT_MESSAGE;
  else if (status === 429) message = retryAfter === undefined ? 'Demasiados intentos. Intenta de nuevo en un momento.' : `Demasiados intentos. Intenta en ${retryAfter} s`;
  else if (status >= 500) message = 'Algo falló en el servidor. Intenta de nuevo en un momento.';
  return { message, fieldErrors, status, retryAfter };
}
