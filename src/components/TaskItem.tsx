import { useRef, useState, type Ref } from 'react';
import { ListGroup, Form, Button } from 'react-bootstrap';
import { formatDate, validateDates } from '../lib/dates';
import { animateRowExit } from '../lib/motion';
import type { Task, TaskUpdate } from '../types/task';
import TaskFields, { type TaskDraft } from './TaskFields';
interface Props {
  task: Task; editing: boolean; onEdit: (id: number | null) => void;
  onToggle: (task: Task) => Promise<boolean>; onDelete: (id: number) => Promise<boolean>;
  onUpdate: (id: number, data: TaskUpdate) => Promise<boolean>; onError: (message: string) => void;
  fieldErrors?: Record<string, string>; cooldown?: number;
}
export default function TaskItem({ task, editing, onEdit, onToggle, onDelete, onUpdate, onError, fieldErrors, cooldown = 0 }: Props) {
  const [value, setValue] = useState<TaskDraft>({ title: task.title, start: task.start_date || '', end: task.end_date || '' });
  const [pending, setPending] = useState(false);
  // react-bootstrap types ListGroup.Item's ref as an anchor; it renders a div.
  const row = useRef<HTMLElement>(null);
  const startEditing = () => {
    setValue({ title: task.title, start: task.start_date || '', end: task.end_date || '' }); onError(''); onEdit(task.id);
  };
  const run = async (operation: () => Promise<boolean>) => {
    if (pending || cooldown) return false;
    setPending(true);
    try { return await operation(); } finally { setPending(false); }
  };
  // Fade and collapse the row first (UX-17); bring it back if the delete fails.
  const remove = () => run(async () => {
    const exit = row.current ? await animateRowExit(row.current) : undefined;
    const removed = await onDelete(task.id);
    if (!removed) exit?.restore();
    return removed;
  });
  const invalid = !value.title.trim() || Boolean(validateDates(value.start, value.end));
  const save = async () => {
    if (invalid) return;
    if (await run(() => onUpdate(task.id, { title: value.title.trim(), start_date: value.start || null, end_date: value.end || null }))) onEdit(null);
  };
  return <ListGroup.Item ref={row as Ref<HTMLAnchorElement>} className="task-row">
    {editing ? <Form onSubmit={event => { event.preventDefault(); void save(); }}>
      <TaskFields value={value} onChange={setValue} errors={fieldErrors} disabled={pending} editing />
      <div className="d-flex gap-2 mt-2">
        <Button type="submit" variant="success" size="sm" disabled={Boolean(invalid || pending || cooldown)}>Guardar</Button>
        <Button variant="secondary" size="sm" disabled={pending} onClick={() => { onError(''); onEdit(null); }}>Cancelar</Button>
      </div>
    </Form> : <div className="d-flex justify-content-between align-items-center">
      <div>
        <Form.Check type="checkbox" checked={task.completed} disabled={Boolean(pending || cooldown)}
          aria-label={task.title} onChange={() => void run(() => onToggle(task))}
          label={<span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</span>} />
        {(task.start_date || task.end_date) && <div className="small text-muted ms-4">
          {task.start_date && <span>Inicio: {formatDate(task.start_date)}</span>}
          {task.start_date && task.end_date && <span> · </span>}
          {task.end_date && <span>Término: {formatDate(task.end_date)}</span>}
        </div>}
      </div>
      <div className="d-flex gap-2">
        <Button variant="outline-warning" size="sm" disabled={Boolean(pending || cooldown)} onClick={startEditing}>Modificar</Button>
        <Button variant="outline-danger" size="sm" disabled={Boolean(pending || cooldown)} onClick={() => void remove()}>Eliminar</Button>
      </div>
    </div>}
  </ListGroup.Item>;
}
