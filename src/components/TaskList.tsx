import { useCallback, useMemo, useState } from 'react';
import { Card, Alert, Button, ListGroup, Toast, ToastContainer } from 'react-bootstrap';
import { useTasks } from '../hooks/useTasks';
import type { Task } from '../types/task';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';
import { MAX_TASKS_PER_USER } from '../lib/limits';

const UNDO_DELAY_MS = 5000;

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
  const { tasks, status, retry, error, fieldErrors, errorId, remaining, setError, create, update, remove, toggle } = useTasks();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState<Task[]>([]);
  const hiddenIds = useMemo(() => new Set(pendingDeletes.map(task => task.id)), [pendingDeletes]);
  const visibleTasks = tasks.filter(task => !hiddenIds.has(task.id));

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
        {status === 'ready' && (tasks.length === 0
          ? <p className="text-muted text-center py-3 mb-0">Aún no tienes tareas. Escribe la primera arriba.</p>
          : visibleTasks.length > 0 && <ListGroup>
            {visibleTasks.map(task => <TaskItem key={task.id} task={task} editing={editingId === task.id}
              onEdit={setEditingId} onToggle={toggle} onDelete={requestDelete} onUpdate={update} onError={setError}
              fieldErrors={errorId === task.id ? fieldErrors : {}} cooldown={remaining} />)}
          </ListGroup>)}
      </Card.Body>
    </Card>
    <ToastContainer position="bottom-center" className="p-3">
      {pendingDeletes.map(task => (
        <Toast key={task.id} autohide delay={UNDO_DELAY_MS} onClose={() => commitDelete(task.id)} aria-label="Tarea eliminada">
          <Toast.Body className="d-flex align-items-center gap-2">
            <span>Tarea eliminada ·</span>
            <Button variant="link" size="sm" className="p-0" aria-label={`Deshacer eliminación de ${task.title}`} onClick={() => undoDelete(task.id)}>Deshacer</Button>
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  </>;
}
