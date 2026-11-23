// TEST-08: unit tests without rendering for lib/dates, api/token and the
// getApiError branches not covered in errors.test.ts.
import { describe, expect, it } from 'vitest';
import { dueStatus, formatDate, isOverdue, validateDates } from '../lib/dates';
import { clearToken, getToken, setToken } from '../api/token';
import { getApiError } from '../api/errors';

describe('lib/dates', () => {
  it('formats calendar dates as dd/mm/yyyy without timezone shifts', () => {
    expect(formatDate('2026-01-01')).toBe('01/01/2026');
    expect(formatDate('2026-12-31')).toBe('31/12/2026');
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
  });

  it('rejects an end date before the start date only', () => {
    expect(validateDates('2026-11-10', '2026-11-01')).toMatch(/no puede ser anterior/);
    expect(validateDates('2026-11-10', '2026-11-10')).toBe('');
    expect(validateDates('2026-11-01', '2026-11-10')).toBe('');
    expect(validateDates('', '2026-11-01')).toBe('');
    expect(validateDates('2026-11-01', '')).toBe('');
  });

  describe('isOverdue at the edge of today', () => {
    // 23:59 local time on 21 Nov 2026: the last minute of "today".
    const now = new Date(2026, 10, 21, 23, 59);

    it('is not overdue on the due date itself', () => {
      expect(isOverdue('2026-11-21', false, now)).toBe(false);
    });

    it('is overdue from the day after the due date', () => {
      expect(isOverdue('2026-11-20', false, now)).toBe(true);
    });

    it('uses the local date just after midnight', () => {
      const justAfterMidnight = new Date(2026, 10, 22, 0, 0, 1);
      expect(isOverdue('2026-11-21', false, justAfterMidnight)).toBe(true);
    });

    it('is never overdue when completed or without an end date', () => {
      expect(isOverdue('2020-01-01', true, now)).toBe(false);
      expect(isOverdue(null, false, now)).toBe(false);
    });
  });
});

describe('api/token', () => {
  it('stores, reads and clears the token in localStorage', () => {
    expect(getToken()).toBeNull();
    setToken('abc.def.ghi');
    expect(getToken()).toBe('abc.def.ghi');
    expect(localStorage.getItem('token')).toBe('abc.def.ghi');
    clearToken();
    expect(getToken()).toBeNull();
  });
});

describe('getApiError remaining branches (ERR-06)', () => {
  it.each([
    [{ code: 'ECONNABORTED', status: 0 }],
    [{ name: 'TimeoutError', status: 0 }],
  ])('treats %j as a timeout', input => {
    expect(getApiError(input).message).toBe('El servidor tardó demasiado. Intenta de nuevo.');
  });

  it('joins field errors into the message when there is no detail', () => {
    const info = getApiError({
      status: 422,
      errors: [
        { field: 'title', message: 'El título es obligatorio' },
        { field: 'end_date', message: 'Fecha inválida' },
      ],
    });
    expect(info.message).toBe('El título es obligatorio. Fecha inválida');
  });

  it('falls back to a generic message for an HTTP error without body', () => {
    expect(getApiError({ status: 400 }).message).toBe('No se pudo completar la solicitud.');
  });

  it('keeps the status for callers that branch on it', () => {
    expect(getApiError({ status: 404 }).status).toBe(404);
    expect(getApiError({ response: { status: 503, data: {} } }).status).toBe(503);
  });
});

describe('dueStatus (UX-11)', () => {
  const now = new Date(2026, 10, 21, 23, 59);
  it('marks pending tasks past their end date as overdue', () => {
    expect(dueStatus('2026-11-20', false, now)).toBe('overdue');
  });
  it('marks pending tasks ending today, using the local day', () => {
    expect(dueStatus('2026-11-21', false, now)).toBe('today');
    expect(dueStatus('2026-11-21', false, new Date(2026, 10, 21, 0, 1))).toBe('today');
  });
  it('shows nothing for future, completed or undated tasks', () => {
    expect(dueStatus('2026-11-22', false, now)).toBeNull();
    expect(dueStatus('2026-11-01', true, now)).toBeNull();
    expect(dueStatus(null, false, now)).toBeNull();
  });
});
