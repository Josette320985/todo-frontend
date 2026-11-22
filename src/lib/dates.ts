/** Format a calendar date without UTC conversion. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
export function validateDates(start: string, end: string): string {
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
