import { useState } from 'react';
import { ListGroup, Form, Button, Row, Col } from 'react-bootstrap';
import { formatDate, validateDates } from '../lib/dates';
import type { Task, TaskUpdate } from '../types/task';
interface Props {
  task: Task; editing: boolean; onEdit: (id: number | null) => void;
  onToggle: (task: Task) => Promise<boolean>; onDelete: (id: number) => Promise<boolean>;
  onUpdate: (id: number, data: TaskUpdate) => Promise<boolean>; onError: (message: string) => void;
}
export default function TaskItem({ task, editing, onEdit, onToggle, onDelete, onUpdate, onError }: Props) {
  const [editTitle, setEditTitle] = useState(task.title);
  const [editStartDate, setEditStartDate] = useState(task.start_date || '');
  const [editEndDate, setEditEndDate] = useState(task.end_date || '');
  const startEditing = () => {
    setEditTitle(task.title); setEditStartDate(task.start_date || ''); setEditEndDate(task.end_date || '');
    onError(''); onEdit(task.id);
  };
  const cancelEditing = () => { onError(''); onEdit(null); };
  const save = async () => {
    if (!editTitle.trim()) return;
    const error = validateDates(editStartDate, editEndDate);
    if (error) { onError(error); return; }
    if (await onUpdate(task.id, { title: editTitle, start_date: editStartDate || null, end_date: editEndDate || null })) onEdit(null);
  };
  return (
<ListGroup.Item>
    {editing ? (
      <div className="w-100">
        <Form.Control
          size="sm"
          className="mb-2"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
        />
        <Row className="g-2 mb-2">
          <Col xs={12} sm={6}>
            <Form.Label className="small text-muted mb-0">
              Fecha de inicio
            </Form.Label>
            <Form.Control
              type="date"
              size="sm"
              value={editStartDate}
              onChange={(e) => setEditStartDate(e.target.value)}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Form.Label className="small text-muted mb-0">
              Fecha de término
            </Form.Label>
            <Form.Control
              type="date"
              size="sm"
              value={editEndDate}
              min={editStartDate || undefined}
              onChange={(e) => setEditEndDate(e.target.value)}
            />
          </Col>
        </Row>
        <div className="d-flex gap-2">
          <Button
            variant="success"
            size="sm"
            onClick={save}
          >
            Guardar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={cancelEditing}
          >
            Cancelar
          </Button>
        </div>
      </div>
    ) : (
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <Form.Check
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task)}
            label={
              <span
                style={{
                  textDecoration: task.completed
                    ? 'line-through'
                    : 'none',
                }}
              >
                {task.title}
              </span>
            }
          />
          {(task.start_date || task.end_date) && (
            <div className="small text-muted ms-4">
              {task.start_date && (
                <span>Inicio: {formatDate(task.start_date)}</span>
              )}
              {task.start_date && task.end_date && <span> · </span>}
              {task.end_date && (
                <span>Término: {formatDate(task.end_date)}</span>
              )}
            </div>
          )}
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-warning"
            size="sm"
            onClick={startEditing}
          >
            Modificar
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => onDelete(task.id)}
          >
            Eliminar
          </Button>
        </div>
      </div>
    )}
  </ListGroup.Item>
  );
}
