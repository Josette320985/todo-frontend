import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../api/tasks';
import { logApiError } from '../api/logError';
import type { Task, TaskCreate, TaskUpdate } from '../types/task';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      if (active) { logApiError('Error cargando tareas', err); setError('No se pudieron cargar las tareas.'); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; mounted.current = false; };
  }, [reload]);
  const mutate = useCallback(async (operation: () => Promise<unknown>) => {
    try {
      await operation();
      if (!mounted.current) return false;
      setError('');
      await reload();
      return true;
    } catch (err) {
      if (mounted.current) { logApiError('Error modificando tarea', err); setError('No se pudo modificar la tarea.'); }
      return false;
    }
  }, [reload]);
  const create = useCallback((data: TaskCreate) => mutate(() => api.createTask(data)), [mutate]);
  const update = useCallback((id: number, data: TaskUpdate) => mutate(() => api.updateTask(id, data)), [mutate]);
  const remove = useCallback((id: number) => mutate(() => api.removeTask(id)), [mutate]);
  const toggle = useCallback((task: Task) => update(task.id, { completed: !task.completed }), [update]);
  return { tasks, loading, error, setError, create, update, remove, toggle };
}
