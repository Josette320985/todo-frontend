import { useState } from 'react';
import { Card, Alert, ListGroup } from 'react-bootstrap';
import { useTasks } from '../hooks/useTasks';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';

export default function TaskList() {
  const { tasks, loading, error, setError, create, update, remove, toggle } = useTasks();
  const [editingId, setEditingId] = useState<number | null>(null);
  return (
    <Card className="mx-auto mt-5 shadow-sm" style={{ maxWidth: '600px' }}>
      <Card.Body>
        <h3 className="mb-4">Mis Tareas</h3>
        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
        <TaskForm onCreate={create} onError={setError} />
        <ListGroup aria-busy={loading}>
          {tasks.length === 0 && !loading && <p className="text-muted text-center">No hay tareas pendientes.</p>}
          {tasks.map(task => <TaskItem key={task.id} task={task} editing={editingId === task.id}
            onEdit={setEditingId} onToggle={toggle} onDelete={remove} onUpdate={update} onError={setError} />)}
        </ListGroup>
      </Card.Body>
    </Card>
  );
}
