import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../api/tasks';
import { logApiError } from '../api/logError';
import { getApiError } from '../api/errors';
import { isPendingFirstSort, sortPendingFirst } from '../lib/taskOrder';
import { useCooldown } from './useCooldown';
import type { Task, TaskCreate, TaskSortField, TaskSortParams, TaskUpdate } from '../types/task';

/** Lifecycle of the task list itself (UX-01), separate from action errors. */
export type ListStatus = 'loading' | 'ready' | 'error';

function applyUpdate(task: Task, data: TaskUpdate): Task {
  return {
    id: task.id,
    title: data.title === undefined || data.title === null ? task.title : data.title,
    description: data.description === undefined ? task.description : data.description,
    completed: data.completed === undefined || data.completed === null ? task.completed : data.completed,
    start_date: data.start_date === undefined ? task.start_date : data.start_date,
    end_date: data.end_date === undefined ? task.end_date : data.end_date,
  };
}

/**
 * Task list state and actions.
 *
 * `sort` is forwarded to the backend, which does the ordering: a list that
 * comes from the backend is never re-sorted here (OPT-02). A change in the sort
 * fields or direction reloads the list. The dependencies are primitives
 * (`sortKey`, `order`), so passing a new object or array on every render does
 * not refetch.
 *
 * After a local change (create, edit, toggle, delete rollback) the list is kept
 * "pending first" in local state only, with the same order the backend uses, so
 * a task that goes back to pending returns to its place without a reload. This
 * applies only while the active sort is the pending-first one.
 */
export function useTasks(sort: TaskSortParams = {}) {
  const { sortBy, order } = sort;
  const sortKey = sortBy?.join(',') ?? '';
  const keepPendingFirst = isPendingFirstSort(sortKey, order);
  const [tasks, setTasks] = useState<Task[]>([]);
  const tasksRef = useRef<Task[]>([]);
  const [status, setStatus] = useState<ListStatus>('loading');
  const [error, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorId, setErrorId] = useState<number | undefined>();
  const { remaining, start } = useCooldown();
  const setError = useCallback((message: string) => { setErrorMessage(message); setFieldErrors({}); }, []);
  const mounted = useRef(false);
  const request = useRef(0);
  const applyTasks = useCallback((next: Task[]) => {
    tasksRef.current = next;
    setTasks(next);
  }, []);
  // Local changes only: the list is re-sorted pending first when that is the active order.
  const updateList = useCallback((change: (current: Task[]) => Task[]) => {
    const next = change(tasksRef.current);
    applyTasks(keepPendingFirst ? sortPendingFirst(next) : next);
  }, [applyTasks, keepPendingFirst]);
  // Only the latest request may update the list; any successful load makes it ready.
  const reload = useCallback(async () => {
    const id = ++request.current;
    const fields = sortKey ? (sortKey.split(',') as TaskSortField[]) : undefined;
    const data = await api.listTasks({ sortBy: fields, order });
    if (mounted.current && id === request.current) { applyTasks(data); setStatus('ready'); }
  }, [applyTasks, sortKey, order]);
  // Initial load, sort change and "Reintentar": a failure shows the list error state, not the action alert.
  const load = useCallback(async () => {
    const id = request.current + 1;
    try { await reload(); } catch (err) {
      if (mounted.current && id === request.current) { logApiError('Error cargando tareas', err); setStatus('error'); }
    }
  }, [reload]);
  const retry = useCallback(() => { setStatus('loading'); return load(); }, [load]);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => { mounted.current = false; };
  }, [load]);
  const reportError = useCallback((err: unknown, id?: number): false => {
    if (!mounted.current) return false;
    const info = getApiError(err);
    logApiError('Error modificando tarea', err);
    setErrorMessage(info.message);
    setFieldErrors(info.fieldErrors);
    setErrorId(id);
    start(info.retryAfter);
    return false;
  }, [start]);
  const create = useCallback(async (data: TaskCreate): Promise<boolean> => {
    try {
      const created = await api.createTask(data);
      if (!mounted.current) return false;
      updateList(current => [...current, created]);
      setError('');
      return true;
    } catch (err) {
      return reportError(err);
    }
  }, [reportError, setError, updateList]);
  const update = useCallback(async (id: number, data: TaskUpdate): Promise<boolean> => {
    const previous = tasksRef.current.find(task => task.id === id);
    if (!previous) return reportError({ status: 404 }, id);
    updateList(current => current.map(task => task.id === id ? applyUpdate(task, data) : task));
    try {
      const saved = await api.updateTask(id, data);
      if (!mounted.current) return false;
      updateList(current => current.map(task => task.id === id ? saved : task));
      setError('');
      return true;
    } catch (err) {
      if (mounted.current) {
        const info = getApiError(err);
        updateList(current => info.status === 404
          ? current.filter(task => task.id !== id)
          : current.map(task => task.id === id ? previous : task));
      }
      return reportError(err, id);
    }
  }, [reportError, setError, updateList]);
  const remove = useCallback(async (id: number): Promise<boolean> => {
    const previousIndex = tasksRef.current.findIndex(task => task.id === id);
    if (previousIndex < 0) return reportError({ status: 404 }, id);
    const previous = tasksRef.current[previousIndex];
    updateList(current => current.filter(task => task.id !== id));
    try {
      await api.removeTask(id);
      if (!mounted.current) return false;
      setError('');
      return true;
    } catch (err) {
      if (mounted.current && getApiError(err).status !== 404) {
        updateList(current => {
          if (current.some(task => task.id === id)) return current;
          const restored = [...current];
          restored.splice(Math.min(previousIndex, restored.length), 0, previous);
          return restored;
        });
      }
      return reportError(err, id);
    }
  }, [reportError, setError, updateList]);
  const toggle = useCallback((task: Task) => update(task.id, { completed: !task.completed }), [update]);
  return { tasks, status, retry, error, fieldErrors, errorId, remaining, setError, create, update, remove, toggle };
}
