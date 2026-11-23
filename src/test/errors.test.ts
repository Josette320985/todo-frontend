import { expect, it } from 'vitest';
import { getApiError, getFormErrorMessage, parseRetryAfter } from '../api/errors';
it.each([
  [{}, 'No hay conexión'],
  [{ kind: 'timeout' }, 'tardó demasiado'],
  [{ status: 404 }, 'ya no existe'],
  [{ status: 500, detail: 'internal trace' }, 'Algo falló'],
  [{ status: 429, retryAfter: '42' }, '42 s'],
  [{ status: 429 }, 'Demasiados intentos'],
  [{ status: 400, detail: 'Datos inválidos' }, 'Datos inválidos'],
  [{ kind: 'cancelled' }, 'cancelada'],
  [{ kind: 'invalid_response', status: 200 }, 'respuesta inválida'],
])('formats %j safely', (input, message) => expect(getApiError(input).message).toContain(message));
it('maps ERR-02 fields and legacy 422 arrays', () => {
  expect(getApiError({ status: 422, errors: [{ field: 'body', message: 'La fecha de término no puede ser anterior a la fecha de inicio' }] }).fieldErrors).toHaveProperty('end_date');
  expect(getApiError({ status: 422, errors: [{ field: 'body', message: 'JSON inválido' }] }).fieldErrors).toEqual({ body: 'JSON inválido' });
  expect(getApiError({ status: 422, errors: [{ field: 'title', message: 'Obligatorio' }] }).fieldErrors).toEqual({ title: 'Obligatorio' });
  expect(getApiError({ response: { status: 422, data: { detail: [{ loc: ['body', 'end_date'], msg: 'Value error, Fecha inválida' }] } } }).fieldErrors).toEqual({ end_date: 'Fecha inválida' });
});
it('rejects malformed retry delays and handles past HTTP dates', () => {
  for (const value of ['', ' ', '-1', '1.5', 'Infinity', '0x10', '1e3']) {
    expect(parseRetryAfter(value)).toBeUndefined();
  }
  expect(parseRetryAfter('0')).toBe(0);
  expect(parseRetryAfter('Wed, 01 Jan 2025 00:00:00 GMT', Date.UTC(2025, 0, 2))).toBe(0);
});
it('suppresses only 422 errors whose fields have an inline destination', () => {
  const info = getApiError({ status: 422, detail: 'Fecha inválida', errors: [{ field: 'end_date', message: 'Fecha inválida' }] });
  expect(getFormErrorMessage(info, ['end_date'])).toBe('');
  expect(getFormErrorMessage(info, ['title'])).toBe('Fecha inválida');
  expect(getFormErrorMessage(getApiError({ status: 422, detail: 'Datos inválidos' }), ['title'])).toBe('Datos inválidos');
  expect(getFormErrorMessage(getApiError({ status: 500 }), ['title'])).toContain('Algo falló');
});
it('handles malformed bodies and HTTP date retry headers', () => {
  expect(() => getApiError({ status: 422, errors: [null, {}, 'bad'] })).not.toThrow();
  expect(parseRetryAfter('Wed, 01 Jan 2025 00:00:42 GMT', Date.UTC(2025, 0, 1))).toBe(42);
  expect(parseRetryAfter('invalid')).toBeUndefined();
});
