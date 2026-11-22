import type { Task } from '../types/task';

/** Client-side view filter of the task list. Never sent to the backend. */
export type TaskFilter = 'all' | 'pending' | 'completed';

export const DEFAULT_TASK_FILTER: TaskFilter = 'all';

/** Options in display order. */
export const TASK_FILTER_OPTIONS: ReadonlyArray<{ value: TaskFilter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'completed', label: 'Completadas' },
];

/** Message shown when the active filter matches no task (the list is not empty). */
export const EMPTY_FILTER_MESSAGE: Record<Exclude<TaskFilter, 'all'>, string> = {
  pending: 'No tienes tareas pendientes.',
  completed: 'Aún no has completado ninguna tarea.',
};

/**
 * Keeps the tasks that match the filter. It only filters: the relative order
 * is the one the backend delivered (OPT-02), so nothing is re-sorted here.
 */
export function filterTasks(tasks: readonly Task[], filter: TaskFilter): Task[] {
  if (filter === 'all') return [...tasks];
  return tasks.filter(task => task.completed === (filter === 'completed'));
}