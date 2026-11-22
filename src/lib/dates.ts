/** Format a calendar date without UTC conversion. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
export function validateDates(start: string, end: string): string {
  return start && end && end < start ? 'La fecha de término no puede ser anterior a la fecha de inicio.' : '';
}
export function isOverdue(end: string | null, completed: boolean, now = new Date()): boolean {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return Boolean(end && !completed && end < today);
}
