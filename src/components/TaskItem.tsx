import { useEffect, useRef, useState, type KeyboardEvent, type Ref } from 'react';
import { ListGroup, Form, Button } from 'react-bootstrap';
import { formatDate, validateDates } from '../lib/dates';
import { animateRowExit } from '../lib/motion';
import type { Task, TaskUpdate } from '../types/task';
import TaskFields, { type TaskDraft } from './TaskFields';
// Inline SVG icons (UX-07): no icon library, they inherit the button color.
const iconProps = { width: 18, height: 18, viewBox: '0 0 16 16', fill: 'currentColor', 'aria-hidden': true, focusable: false } as const;
function PencilIcon() {
  return <svg {...iconProps}><path d="M12.15.85a1.5 1.5 0 0 1 2.12 0l.88.88a1.5 1.5 0 0 1 0 2.12L5.5 13.5l-3.5.85.85-3.5zM11.44 3 13 4.56l1.44-1.44-1.56-1.56zm.85 2.27L10.73 3.7 3.76 10.67l-.47 1.98 1.98-.47z" /></svg>;
}
function TrashIcon() {
  return <svg {...iconProps}><path d="M6 1.5h4a.5.5 0 0 1 .5.5v1H14a.5.5 0 0 1 0 1h-.6l-.76 9.9a1.5 1.5 0 0 1-1.5 1.35H4.86a1.5 1.5 0 0 1-1.5-1.35L2.6 4H2a.5.5 0 0 1 0-1h3.5V2a.5.5 0 0 1 .5-.5M6.5 3h3v-.5h-3zM3.6 4l.75 9.82a.5.5 0 0 0 .5.43h6.3a.5.5 0 0 0 .5-.43L12.4 4zm2.9 1.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5" /></svg>;
}
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
  // UX-08: after saving or cancelling, focus goes back to this row's edit
  // button so a keyboard user keeps their place in the list. Only when this
  // row closed its own editor: opening another row must not steal focus.
  const editButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  useEffect(() => {
    if (!editing && returnFocus.current) {
      returnFocus.current = false;
      editButton.current?.focus();
    }
  }, [editing]);
  const close = () => { returnFocus.current = true; onEdit(null); };
  const cancel = () => { onError(''); close(); };
  // Enter already submits the form (save); Escape cancels.
  const onEditorKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape' && !pending) { event.preventDefault(); cancel(); }
  };
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
    if (await run(() => onUpdate(task.id, { title: value.title.trim(), start_date: value.start || null, end_date: value.end || null }))) close();
  };
  return <ListGroup.Item ref={row as Ref<HTMLAnchorElement>} className="task-row">
    {editing ? <Form onSubmit={event => { event.preventDefault(); void save(); }} onKeyDown={onEditorKeyDown}>
      <TaskFields value={value} onChange={setValue} errors={fieldErrors} disabled={pending} editing />
      <div className="d-flex gap-2 mt-2">
        <Button type="submit" variant="success" size="sm" disabled={Boolean(invalid || pending || cooldown)}>Guardar</Button>
        <Button variant="secondary" size="sm" disabled={pending} onClick={cancel}>Cancelar</Button>
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
      {/* Icon actions (UX-07): the accessible name carries the task title so a
          screen reader can tell the rows apart; title gives the mouse tooltip. */}
      <div className="task-actions d-flex gap-1">
        <Button ref={editButton} variant="outline-warning" size="sm" className="icon-button" disabled={Boolean(pending || cooldown)}
          aria-label={`Modificar: ${task.title}`} title="Modificar" onClick={startEditing}><PencilIcon /></Button>
        <Button variant="outline-danger" size="sm" className="icon-button" disabled={Boolean(pending || cooldown)}
          aria-label={`Eliminar: ${task.title}`} title="Eliminar" onClick={() => void remove()}><TrashIcon /></Button>
      </div>
    </div>}
  </ListGroup.Item>;
}
