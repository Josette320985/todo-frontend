import api from './client';
import type { Task, TaskCreate, TaskSortParams, TaskUpdate } from '../types/task';

/**
 * Lists the user's tasks. `sortBy` is sent as a repeated `sort_by` query
 * parameter, in order. Without it nothing is sent and the backend uses its
 * fallback order (OPT-02).
 */
export const listTasks = async ({ sortBy, order }: TaskSortParams = {}): Promise<Task[]> => {
  const query = new URLSearchParams();
  sortBy?.forEach(field => query.append('sort_by', field));
  if (sortBy?.length && order) query.set('order', order);
  const qs = query.toString();
  return (await api.get<Task[]>(qs ? `/v1/tasks/?${qs}` : '/v1/tasks/')).data;
};
export const createTask = async (task: TaskCreate): Promise<Task> => (await api.post<Task>('/v1/tasks/', task)).data;
export const updateTask = async (id: number, task: TaskUpdate): Promise<Task> => (await api.put<Task>(`/v1/tasks/${id}`, task)).data;
export const removeTask = async (id: number): Promise<void> => { await api.delete(`/v1/tasks/${id}`); };
