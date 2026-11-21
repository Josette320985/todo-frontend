import api from './client';
import type { Task, TaskCreate, TaskUpdate } from '../types/task';

export const listTasks = async (): Promise<Task[]> => (await api.get<Task[]>('/v1/tasks/')).data;
export const createTask = async (task: TaskCreate): Promise<Task> => (await api.post<Task>('/v1/tasks/', task)).data;
export const updateTask = async (id: number, task: TaskUpdate): Promise<Task> => (await api.put<Task>(`/v1/tasks/${id}`, task)).data;
export const removeTask = async (id: number): Promise<void> => { await api.delete(`/v1/tasks/${id}`); };
