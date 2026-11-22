import { expect, it } from 'vitest';
import { getApiError, parseRetryAfter } from '../api/errors';
it.each([
  [{}, 'No hay conexión'],
  [{ kind: 'timeout' }, 'tardó demasiado'],
  [{ status: 404 }, 'ya no existe'],
  [{ status: 500, detail: 'internal trace' }, 'Algo falló'],
  [{ status: 429, retryAfter: '42' }, '42 s'],
  [{ status: 429 }, 'Demasiados intentos'],
  [{ status: 400, detail: 'Datos inválidos' }, 'Datos inválidos'],
  [{ kind: 'cancelled' }, 'cancelada'],
])('formats %j safely', (input, message) => expect(getApiError(input).message).toContain(message));
it('maps ERR-02 fields and legacy 422 arrays', () => {
  expect(getApiError({ status: 422, errors: [{ field: 'title', message: 'Obligatorio' }] }).fieldErrors).toEqual({ title: 'Obligatorio' });
  expect(getApiError({ response: { status: 422, data: { detail: [{ loc: ['body', 'end_date'], msg: 'Value error, Fecha inválida' }] } } }).fieldErrors).toEqual({ end_date: 'Fecha inválida' });
});
it('handles malformed bodies and HTTP date retry headers', () => {
  expect(() => getApiError({ status: 422, errors: [null, {}, 'bad'] })).not.toThrow();
  expect(parseRetryAfter('Wed, 01 Jan 2025 00:00:42 GMT', Date.UTC(2025, 0, 1))).toBe(42);
  expect(parseRetryAfter('invalid')).toBeUndefined();
});
