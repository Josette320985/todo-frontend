import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../api/tasks';
import { logApiError } from '../api/logError';
import { getApiError } from '../api/errors';
import { useCooldown } from './useCooldown';
import type { Task, TaskCreate, TaskUpdate } from '../types/task';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorId, setErrorId] = useState<number | undefined>();
  const { remaining, start } = useCooldown();
  const setError = useCallback((message: string) => { setErrorMessage(message); setFieldErrors({}); }, []);
  const mounted = useRef(false);
  const request = useRef(0);
  const reload = useCallback(async () => {
    const id = ++request.current;
    const data = await api.listTasks();
    if (mounted.current && id === request.current) setTasks(data);
  }, []);
  useEffect(() => {
    mounted.current = true;
    let active = true;
    reload().catch(err => {
      if (active) { logApiError('Error cargando tareas', err); setError(getApiError(err).message); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; mounted.current = false; };
  }, [reload, setError]);
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
  return { tasks, loading, error, fieldErrors, errorId, remaining, setError, create, update, remove, toggle };
}
