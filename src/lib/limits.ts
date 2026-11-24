/**
 * Per-user task cap enforced by the backend (SEG-H12, MAX_TASKS_PER_USER).
 * Keep both values in sync: the backend is the authority and still answers
 * 409 if this copy ever drifts; the frontend only uses it to warn earlier.
 */
export const MAX_TASKS_PER_USER = 500;

export const TASK_LIMIT_MESSAGE =
  `Llegaste al máximo de ${MAX_TASKS_PER_USER} tareas. Elimina alguna para agregar otra.`;

/** Input character limits mirrored from the backend schemas. */
export const MAX_EMAIL_LENGTH = 2048;
export const MAX_PASSWORD_LENGTH = 72;
export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 1000;
