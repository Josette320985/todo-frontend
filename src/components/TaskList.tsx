import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Card, Alert, Button, ListGroup, Toast, ToastContainer } from 'react-bootstrap';
import { useTasks } from '../hooks/useTasks';
import type { Task, TaskSortParams } from '../types/task';
import { DEFAULT_TASK_FILTER, EMPTY_FILTER_MESSAGE, filterTasks, type TaskFilter as Filter } from '../lib/taskFilter';
import TaskFilter from './TaskFilter';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';
import TaskSummary from './TaskSummary';
import { MAX_TASKS_PER_USER } from '../lib/limits';

const UNDO_DELAY_MS = 5000;
const COMPLETION_TOAST_MS = 3000;

function CheckCircleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 16 16" fill="currentColor" className="text-success flex-shrink-0" aria-hidden="true" focusable="false">
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
    </svg>
  );
}

// TEMPORARY test variable: sorting passed to useTasks until the sort control
// exists. Pending first, completed last: the backend applies these fields in
// sequence (completed, end_date with undated last, id), the same order as its
// OPT-02 fallback. The frontend does not re-sort the result.
const TEST_SORT: TaskSortParams = { sortBy: ['completed', 'end_date', 'id'], order: 'asc' };

/** Three grey rows shaped like tasks while the list loads (UX-01). */
function TaskListSkeleton() {
  return (
    <div role="status" aria-label="Cargando tareas">
      <ListGroup aria-hidden="true" className="placeholder-glow">
        {['col-7', 'col-5', 'col-6'].map(width => (
          <ListGroup.Item key={width} className="d-flex align-items-center gap-2 py-3">
            <span className="placeholder rounded" style={{ width: '1rem', height: '1rem' }} />
            <span className={`placeholder rounded ${width}`} />
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
}

export default function TaskList() {
  const { tasks, status, retry, error, fieldErrors, errorId, remaining, setError, create, update, remove, toggle } = useTasks(TEST_SORT);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState<Task[]>([]);
  const [completedBanner, setCompletedBanner] = useState<{ key: number; id: number; title: string } | null>(null);
  // View filter: local state only, the backend is never involved.
  const [filter, setFilter] = useState<Filter>(DEFAULT_TASK_FILTER);
  const hiddenIds = useMemo(() => new Set(pendingDeletes.map(task => task.id)), [pendingDeletes]);
  const visibleTasks = tasks.filter(task => !hiddenIds.has(task.id));
  const shownTasks = filterTasks(visibleTasks, filter);
  const allTasksCompleted = Boolean(
    completedBanner && visibleTasks.length > 0 && visibleTasks.every(item => item.completed || item.id === completedBanner.id),
  );

  const handleCompleted = useCallback((task: Task) => {
    setCompletedBanner({ key: Date.now(), id: task.id, title: task.title });
  }, []);

  useEffect(() => {
    if (!completedBanner) return;
    const timer = window.setTimeout(() => setCompletedBanner(null), COMPLETION_TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [completedBanner]);

  const requestDelete = useCallback(async (id: number): Promise<boolean> => {
    const task = tasks.find(item => item.id === id);
    if (!task || hiddenIds.has(id)) return false;
    setPendingDeletes(current => [...current, task]);
    return true;
  }, [hiddenIds, tasks]);

  const undoDelete = useCallback((id: number) => {
    setPendingDeletes(current => current.filter(task => task.id !== id));
  }, []);

  const commitDelete = useCallback((id: number) => {
    setPendingDeletes(current => current.filter(task => task.id !== id));
    void remove(id);
  }, [remove]);

  // Manual undo timers with pause/resume on tab visibility (UX-19).
  // React Bootstrap's autohide cannot be paused, so we drive the delay
  // ourselves and keep the remaining time when the tab is hidden.
  const undoTimersRef = useRef<Map<number, { timeoutId: number; remaining: number; startedAt: number }>>(new Map());

  useEffect(() => {
    const timers = undoTimersRef.current;
    // Start a timer for each newly pending delete.
    for (const task of pendingDeletes) {
      if (!timers.has(task.id)) {
        const entry = { timeoutId: 0, remaining: UNDO_DELAY_MS, startedAt: Date.now() };
        entry.timeoutId = window.setTimeout(() => {
          commitDelete(task.id);
        }, UNDO_DELAY_MS);
        timers.set(task.id, entry);
      }
    }
    // Clear timers for deletes that are no longer pending (undo).
    for (const id of Array.from(timers.keys())) {
      if (!pendingDeletes.some(task => task.id === id)) {
        const entry = timers.get(id);
        if (entry) clearTimeout(entry.timeoutId);
        timers.delete(id);
      }
    }
  }, [pendingDeletes, commitDelete]);

  useEffect(() => {
    const handleVisibility = () => {
      const timers = undoTimersRef.current;
      if (document.hidden) {
        for (const entry of timers.values()) {
          clearTimeout(entry.timeoutId);
          entry.remaining = Math.max(0, entry.remaining - (Date.now() - entry.startedAt));
        }
      } else {
        for (const [id, entry] of timers.entries()) {
          entry.startedAt = Date.now();
          entry.timeoutId = window.setTimeout(() => {
            commitDelete(id);
          }, entry.remaining);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [commitDelete]);

  useEffect(() => {
    const timers = undoTimersRef.current;
    return () => {
      for (const entry of timers.values()) clearTimeout(entry.timeoutId);
      timers.clear();
    };
  }, []);

  return <>
    <Card className="mx-auto mt-5 shadow-sm" style={{ maxWidth: '600px' }}>
      <Card.Body>
        <h3 className="mb-4">Mis Tareas</h3>
        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
        <TaskForm onCreate={create} onError={setError} fieldErrors={errorId === undefined ? fieldErrors : {}} cooldown={remaining}
          atLimit={status === 'ready' && tasks.length >= MAX_TASKS_PER_USER} />
        {status === 'loading' && <TaskListSkeleton />}
        {status === 'error' && (
          <Alert variant="danger" className="d-flex justify-content-between align-items-center gap-3 mb-0">
            <span>No pudimos cargar tus tareas</span>
            <Button variant="outline-danger" size="sm" onClick={() => void retry()}>Reintentar</Button>
          </Alert>
        )}
        {status === 'ready' && tasks.length > 0 && <TaskSummary tasks={tasks} />}
        {status === 'ready' && tasks.length > 0 && <TaskFilter value={filter} onChange={setFilter} />}
        {status === 'ready' && (tasks.length === 0
          ? <p className="text-muted text-center py-3 mb-0">Aún no tienes tareas. Escribe la primera arriba.</p>
          : shownTasks.length > 0
            ? <ListGroup>
              {shownTasks.map(task => <TaskItem key={task.id} task={task} editing={editingId === task.id}
                onEdit={setEditingId} onToggle={toggle} onDelete={requestDelete} onUpdate={update} onError={setError}
                onCompleted={handleCompleted} fieldErrors={errorId === task.id ? fieldErrors : {}} cooldown={remaining} />)}
            </ListGroup>
            : visibleTasks.length > 0 && filter !== 'all' && (
              <p className="text-muted text-center py-3 mb-0">{EMPTY_FILTER_MESSAGE[filter]}</p>
            ))}
      </Card.Body>
    </Card>
    <ToastContainer position="bottom-center" className="p-3">
      {completedBanner && (
        <div key={completedBanner.key} className="toast show completion-toast shadow-sm" role="status" aria-live="polite"
          aria-label="Tarea completada">
          <div className="toast-body d-flex align-items-center gap-2">
            <CheckCircleIcon />
            <div className="min-w-0 flex-grow-1">
              <strong className="text-success-emphasis d-block">¡Tarea completada!</strong>
              <span className="small text-muted text-truncate d-block">{`Completaste: ${completedBanner.title}`}</span>
            </div>
            {allTasksCompleted && <Badge pill bg="success">¡Todo al día!</Badge>}
            <button type="button" className="btn-close btn-close-sm ms-1" aria-label="Cerrar aviso"
              onClick={() => setCompletedBanner(null)} />
          </div>
        </div>
      )}
      {pendingDeletes.map(task => (
        <Toast key={task.id} onClose={() => commitDelete(task.id)} aria-label="Tarea eliminada">
          <Toast.Body className="d-flex align-items-center gap-2">
            <span>Tarea eliminada ·</span>
            <Button variant="link" size="sm" className="p-0" aria-label={`Deshacer eliminación de ${task.title}`} onClick={() => undoDelete(task.id)}>Deshacer</Button>
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  </>;
}
