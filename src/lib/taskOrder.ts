import type { SortOrder, Task } from '../types/task';

/** The fields of the OPT-02 order, as `useTasks` joins them into `sortKey`. */
const PENDING_FIRST_KEY = 'completed,end_date,id';

/**
 * True when the list is meant to be "pending first" (OPT-02): either no sort
 * was requested (the backend fallback is that order) or the requested one is
 * exactly completed, end_date, id ascending. Any other sort must not be
 * regrouped, it would break the order the user asked for.
 */
export function isPendingFirstSort(sortKey: string, order?: SortOrder): boolean {
  return sortKey === '' || (sortKey === PENDING_FIRST_KEY && (order ?? 'asc') === 'asc');
}

/**
 * Same order as the backend (OPT-02): pending first, then by end_date with
 * undated tasks last, then by id. ISO dates (YYYY-MM-DD) compare as strings.
 */
export function compareTasks(a: Task, b: Task): number {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  if (a.end_date !== b.end_date) {
    if (a.end_date === null) return 1;
    if (b.end_date === null) return -1;
    return a.end_date < b.end_date ? -1 : 1;
  }
  return a.id - b.id;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Returns a new list in OPT-02 order. Only for local changes, never for a backend load. */
export function sortPendingFirst(tasks: readonly Task[]): Task[] {
  return [...tasks].sort(compareTasks);
}