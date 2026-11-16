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
