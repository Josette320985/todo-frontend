import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../api/tasks';
import { logApiError } from '../api/logError';
import { getApiError } from '../api/errors';
import { useCooldown } from './useCooldown';
import type { Task, TaskCreate, TaskUpdate } from '../types/task';

/** Lifecycle of the task list itself (UX-01), separate from action errors. */
export type ListStatus = 'loading' | 'ready' | 'error';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<ListStatus>('loading');
  const [error, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorId, setErrorId] = useState<number | undefined>();
  const { remaining, start } = useCooldown();
  const setError = useCallback((message: string) => { setErrorMessage(message); setFieldErrors({}); }, []);
  const mounted = useRef(false);
  const request = useRef(0);
  // Only the latest request may update the list; any successful load makes it ready.
  const reload = useCallback(async () => {
    const id = ++request.current;
    const data = await api.listTasks();
    if (mounted.current && id === request.current) { setTasks(data); setStatus('ready'); }
  }, []);
  // Initial load and "Reintentar": a failure shows the list error state, not the action alert.
  const load = useCallback(async () => {
    const id = request.current + 1;
    try { await reload(); } catch (err) {
      if (mounted.current && id === request.current) { logApiError('Error cargando tareas', err); setStatus('error'); }
    }
  }, [reload]);
  const retry = useCallback(() => { setStatus('loading'); return load(); }, [load]);
  useEffect(() => {
    mounted.current = true;
    void load(); // status starts as 'loading'
    return () => { mounted.current = false; };
  }, [load]);
  const mutate = useCallback(async (operation: () => Promise<unknown>, id?: number) => {
    try {
      await operation();
      if (!mounted.current) return false;
      setError('');
      // The mutation already succeeded: a failed refresh must not invite a duplicate POST.
      await reload().catch(err => { if (mounted.current) setError(getApiError(err).message); });
      return true;
    } catch (err) {
      if (mounted.current) {
        const info = getApiError(err);
        logApiError('Error modificando tarea', err);
        setErrorMessage(info.message); setFieldErrors(info.fieldErrors); setErrorId(id); start(info.retryAfter);
        if (info.status === 404 && id !== undefined) setTasks(current => current.filter(task => task.id !== id));
      }
      return false;
    }
  }, [reload, setError, start]);
  const create = useCallback((data: TaskCreate) => mutate(() => api.createTask(data)), [mutate]);
  const update = useCallback((id: number, data: TaskUpdate) => mutate(() => api.updateTask(id, data), id), [mutate]);
  const remove = useCallback((id: number) => mutate(() => api.removeTask(id), id), [mutate]);
  const toggle = useCallback((task: Task) => update(task.id, { completed: !task.completed }), [update]);
  return { tasks, status, retry, error, fieldErrors, errorId, remaining, setError, create, update, remove, toggle };
}
