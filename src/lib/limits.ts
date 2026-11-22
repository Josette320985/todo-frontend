/**
 * Per-user task cap enforced by the backend (SEG-H12, MAX_TASKS_PER_USER).
 * Keep both values in sync: the backend is the authority and still answers
 * 409 if this copy ever drifts; the frontend only uses it to warn earlier.
 */
export const MAX_TASKS_PER_USER = 500;

export const TASK_LIMIT_MESSAGE =
  `Llegaste al máximo de ${MAX_TASKS_PER_USER} tareas. Elimina alguna para agregar otra.`;
