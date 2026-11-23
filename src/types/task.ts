/**
 * Task representation returned by the backend API (`TaskRead` schema).
 */
export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  start_date: string | null;
  end_date: string | null;
}

/**
 * Request body for creating a new task (`TaskCreate` schema).
 */
export interface TaskCreate {
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

/**
 * Request body for partially updating an existing task (`TaskUpdate` schema).
 */
export interface TaskUpdate {
  title?: string | null;
  description?: string | null;
  completed?: boolean | null;
  start_date?: string | null;
  end_date?: string | null;
}

/**
 * Fields `GET /tasks` can sort by. Mirrors the backend `TaskSortField` enum
 * (`app/utils/task_sorting.py`).
 */
export type TaskSortField = 'completed' | 'end_date' | 'start_date' | 'title' | 'id';

/** Sort direction. Mirrors the backend `SortOrder` enum. */
export type SortOrder = 'asc' | 'desc';

/**
 * Sorting options for listing tasks. `sortBy` is an ordered list of fields
 * (like an SQL ORDER BY), all in the direction `order`. When `sortBy` is
 * omitted nothing is sent and the backend applies its fallback (OPT-02:
 * completed, end_date, id), so the client never has to re-sort the result.
 */
export interface TaskSortParams {
  sortBy?: readonly TaskSortField[];
  order?: SortOrder;
}