/** Format a calendar date without UTC conversion. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
export function validateDate(value: string): string {
  if (!value) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Ingresa una fecha válida.';
  const [year, month, day] = value.split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]
    ? 'Ingresa una fecha válida.' : '';
}
export function validateDates(start: string, end: string): string {
  if (validateDate(start) || validateDate(end)) return 'Ingresa una fecha válida.';
  return start && end && end < start ? 'La fecha de término no puede ser anterior a la fecha de inicio.' : '';
}
/** Local calendar day as YYYY-MM-DD, comparable with the API dates as strings. */
export function localToday(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function isOverdue(end: string | null, completed: boolean, now = new Date()): boolean {
  return Boolean(end && !completed && end < localToday(now));
}
/** Due badge of a pending task (UX-11): past its end date, or ending today. */
export function dueStatus(end: string | null, completed: boolean, now = new Date()): 'overdue' | 'today' | null {
  if (!end || completed) return null;
  const today = localToday(now);
  return end < today ? 'overdue' : end === today ? 'today' : null;
}
