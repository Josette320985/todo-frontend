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
  const text = String(value).trim();
  if (/^\d+$/.test(text)) {
    const seconds = Number(text);
    return Number.isSafeInteger(seconds) ? seconds : undefined;
  }
  if (!/^[A-Za-z]{3}, /.test(text)) return undefined;
  const date = Date.parse(text);
  return Number.isFinite(date) ? Math.max(0, Math.ceil((date - now) / 1000)) : undefined;
}

/** Field errors already rendered inline must not also fill a global alert. */
export function getFormErrorMessage(info: ApiErrorInfo, visibleFields: readonly string[]): string {
  const fields = Object.keys(info.fieldErrors);
  return info.status === 422 && fields.length > 0 && fields.every(field => visibleFields.includes(field))
    ? '' : info.message;
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
    let field = typeof item.field === 'string' ? item.field : Array.isArray(item.loc) ? item.loc.at(-1) : undefined;
    const message = item.message ?? item.msg;
    // ERR-02 currently reports model-level date-range validation as "body".
    // Route only this known rule to its control; leave unknown body errors global.
    if ((field === 'body' || field === 'general') && typeof message === 'string'
      && /fecha de término no puede ser anterior a la fecha de inicio/i.test(message)) field = 'end_date';
    if (typeof field === 'string' && typeof message === 'string') {
      Object.defineProperty(fieldErrors, field, { value: message.replace(/^Value error,\s*/i, ''), enumerable: true, configurable: true });
    }
  }
  let message = typeof data.detail === 'string' && data.detail.trim()
    ? data.detail : Object.values(fieldErrors).join('. ') || 'No se pudo completar la solicitud.';
  if (err.kind === 'invalid_response') message = 'El servidor devolvió una respuesta inválida. Intenta de nuevo.';
  else if (err.kind === 'timeout' || err.code === 'ECONNABORTED' || err.name === 'TimeoutError') message = 'El servidor tardó demasiado. Intenta de nuevo.';
  else if (err.kind === 'cancelled') message = 'Solicitud cancelada.';
  else if (!status || (status === 503 && data.code === 'upstream_unavailable')) message = 'No hay conexión con el servidor. Revisa tu internet.';
  else if (status === 404) message = 'Esta tarea ya no existe';
  // SEG-H12: the backend refused a new task because the user hit the cap.
  else if (status === 409 && data.code === 'task_limit_reached') message = TASK_LIMIT_MESSAGE;
  else if (status === 429) message = retryAfter === undefined ? 'Demasiados intentos. Intenta de nuevo en un momento.' : `Demasiados intentos. Intenta en ${retryAfter} s`;
  else if (status >= 500) message = 'Algo falló en el servidor. Intenta de nuevo en un momento.';
  return { message, fieldErrors, status, retryAfter };
}
