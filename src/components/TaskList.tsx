import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@ui-sdk/react/button';
import { Toast, ToastAction, ToastDescription, ToastRegion, ToastTitle, createToaster } from '@ui-sdk/react/toast';
import { useTasks } from '../hooks/useTasks';
import type { Task, TaskSortParams } from '../types/task';
import { DEFAULT_TASK_FILTER, EMPTY_FILTER_MESSAGE, filterTasks, type TaskFilter as Filter } from '../lib/taskFilter';
import { cardClass, mutedTextClass } from '../lib/ui';
import Alert from './Alert';
import Skeleton from './Skeleton';
import TaskFilter from './TaskFilter';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';
import TaskSummary from './TaskSummary';
import { MAX_TASKS_PER_USER } from '../lib/limits';

const UNDO_DELAY_MS = 5000;

// TEMPORARY test variable: sorting passed to useTasks until the sort control
// exists. Pending first, completed last: the backend applies these fields in
// sequence (completed, end_date with undated last, id), the same order as its
// OPT-02 fallback. The frontend does not re-sort the result.
const TEST_SORT: TaskSortParams = { sortBy: ['completed', 'end_date', 'id'], order: 'asc' };

const listClass = 'divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800';

/** Three grey rows shaped like tasks while the list loads (UX-01). */
function TaskListSkeleton() {
  return (
    <div role="status" aria-label="Cargando tareas">
      <ul aria-hidden="true" className={listClass}>
        {['70%', '50%', '60%'].map(width => (
          <li key={width} className="flex items-center gap-3 px-4 py-4">
            <Skeleton width="1rem" height="1rem" />
            <Skeleton width={width} height="1rem" />
          </li>
        ))}
      </ul>
    </div>
  );
}

interface UndoData { taskId: number; taskTitle: string }

function isUndoData(data: unknown): data is UndoData {
  return typeof data === 'object' && data !== null && 'taskId' in data && 'taskTitle' in data;
}

export default function TaskList() {
  const { tasks, status, retry, error, fieldErrors, errorId, remaining, setError, create, update, remove, toggle } = useTasks(TEST_SORT);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState<Task[]>([]);
  // View filter: local state only, the backend is never involved.
  const [filter, setFilter] = useState<Filter>(DEFAULT_TASK_FILTER);
  const hiddenIds = useMemo(() => new Set(pendingDeletes.map(task => task.id)), [pendingDeletes]);
  const visibleTasks = tasks.filter(task => !hiddenIds.has(task.id));
  const shownTasks = filterTasks(visibleTasks, filter);
  // The toaster times the undo window (UX-04) and pauses it while the tab is
  // hidden or the pointer/focus is on the toast (UX-19).
  const [toaster] = useState(() => createToaster({ duration: UNDO_DELAY_MS }));
  // Closing a toast commits its delete, except after Deshacer or when the list
  // unmounts: like the old timers, leaving the page drops pending deletes.
  const undone = useRef(new Set<number>());
  const unmounting = useRef(false);

  const undoDelete = useCallback((id: number) => {
    undone.current.add(id);
    setPendingDeletes(current => current.filter(task => task.id !== id));
  }, []);

  const commitDelete = useCallback((id: number) => {
    if (undone.current.delete(id) || unmounting.current) return;
    setPendingDeletes(current => current.filter(task => task.id !== id));
    void remove(id);
  }, [remove]);

  const requestDelete = useCallback(async (id: number): Promise<boolean> => {
    const task = tasks.find(item => item.id === id);
    if (!task || hiddenIds.has(id)) return false;
    undone.current.delete(id);
    setPendingDeletes(current => [...current, task]);
    toaster({
      id: String(id),
      title: 'Tarea eliminada',
      description: task.title,
      data: { taskId: id, taskTitle: task.title } satisfies UndoData,
      onDismiss: () => commitDelete(id),
    });
    return true;
  }, [commitDelete, hiddenIds, tasks, toaster]);

  useEffect(() => {
    unmounting.current = false;
    return () => { unmounting.current = true; toaster.dismiss(); };
  }, [toaster]);

  return <>
    <section className={`${cardClass} max-w-2xl`}>
      <h3 className="mb-6 text-2xl font-semibold tracking-tight">Mis Tareas</h3>
      {error && <Alert className="mb-4" onClose={() => setError('')}>{error}</Alert>}
      <TaskForm onCreate={create} onError={setError} fieldErrors={errorId === undefined ? fieldErrors : {}} cooldown={remaining}
        atLimit={status === 'ready' && tasks.length >= MAX_TASKS_PER_USER} />
      {status === 'loading' && <TaskListSkeleton />}
      {status === 'error' && (
        <Alert>
          <div className="flex items-center justify-between gap-3">
            <span>No pudimos cargar tus tareas</span>
            <Button data-variant="destructive" onClick={() => retry()}>Reintentar</Button>
          </div>
        </Alert>
      )}
      {status === 'ready' && tasks.length > 0 && <TaskSummary tasks={tasks} />}
      {status === 'ready' && tasks.length > 0 && <TaskFilter value={filter} onChange={setFilter} />}
      {status === 'ready' && (tasks.length === 0
        ? <p className={`${mutedTextClass} py-6 text-center`}>Aún no tienes tareas. Escribe la primera arriba.</p>
        : shownTasks.length > 0
          ? <ul className={listClass}>
            {shownTasks.map(task => <TaskItem key={task.id} task={task} editing={editingId === task.id}
              onEdit={setEditingId} onToggle={toggle} onDelete={requestDelete} onUpdate={update} onError={setError}
              fieldErrors={errorId === task.id ? fieldErrors : {}} cooldown={remaining} />)}
          </ul>
          : visibleTasks.length > 0 && filter !== 'all' && (
            <p className={`${mutedTextClass} py-6 text-center`}>{EMPTY_FILTER_MESSAGE[filter]}</p>
          ))}
    </section>
    <ToastRegion toaster={toaster} side="bottom" align="center" aria-label="Notificaciones">
      {item => {
        const undo = isUndoData(item.data) ? item.data : undefined;
        return <Toast className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <ToastTitle />
            <ToastDescription className="truncate" />
          </div>
          <ToastAction dismiss aria-label={`Deshacer eliminación de ${undo?.taskTitle ?? ''}`}
            onAction={() => { if (undo) undoDelete(undo.taskId); }}>
            Deshacer
          </ToastAction>
        </Toast>;
      }}
    </ToastRegion>
  </>;
}
