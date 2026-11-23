import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '@ui-sdk/react/button';
import { Checkbox, CheckboxIndicator } from '@ui-sdk/react/checkbox';
import { dueStatus, formatDate, validateDates } from '../lib/dates';
import { validateDescription, validateTitle } from '../lib/validation';
import { animateRowExit } from '../lib/motion';
import type { Task, TaskUpdate } from '../types/task';
import TaskFields, { type TaskDraft } from './TaskFields';
import { PencilIcon, TrashIcon } from './Icons';
interface Props {
  task: Task; editing: boolean; onEdit: (id: number | null) => void;
  onToggle: (task: Task) => Promise<boolean>; onDelete: (id: number) => Promise<boolean>;
  onUpdate: (id: number, data: TaskUpdate) => Promise<boolean>; onError: (message: string) => void;
  fieldErrors?: Record<string, string>; cooldown?: number;
}
const badgeClass = 'ms-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
export default function TaskItem({ task, editing, onEdit, onToggle, onDelete, onUpdate, onError, fieldErrors, cooldown = 0 }: Props) {
  const [value, setValue] = useState<TaskDraft>({ title: task.title, description: task.description || '', start: task.start_date || '', end: task.end_date || '' });
  const [pending, setPending] = useState(false);
  const row = useRef<HTMLLIElement>(null);
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
    setValue({ title: task.title, description: task.description || '', start: task.start_date || '', end: task.end_date || '' }); onError(''); onEdit(task.id);
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
  const due = dueStatus(task.end_date, task.completed);
  const invalid = Boolean(validateTitle(value.title) || validateDescription(value.description) || validateDates(value.start, value.end));
  const save = async () => {
    if (invalid) return;
    if (await run(() => onUpdate(task.id, { title: value.title.trim(), description: value.description.trim() || null, start_date: value.start || null, end_date: value.end || null }))) close();
  };
  const busy = Boolean(pending || cooldown);
  return <li ref={row} className="task-row px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
    {editing ? <form onSubmit={event => { event.preventDefault(); void save(); }} onKeyDown={onEditorKeyDown} className="flex flex-col gap-3">
      <TaskFields value={value} onChange={setValue} errors={fieldErrors} disabled={pending} editing />
      <div className="flex gap-2">
        <Button type="submit" data-variant="solid" disabled={Boolean(invalid || busy)}>Guardar</Button>
        <Button disabled={pending} onClick={cancel}>Cancelar</Button>
      </div>
    </form> : <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="task-main">
        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox id={`task-${task.id}`} className="mt-0.5 shrink-0" checked={task.completed} disabled={busy}
            onCheckedChange={() => void run(() => onToggle(task))}>
            <CheckboxIndicator />
          </Checkbox>
          <span className={`task-title font-medium ${task.completed ? 'text-neutral-500 line-through dark:text-neutral-400' : ''}`}>{task.title}</span>
        </label>
        {task.description && <p className="task-description ms-7 mt-1 text-sm text-neutral-500 dark:text-neutral-400">{task.description}</p>}
        {(task.start_date || task.end_date) && <div className="ms-7 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {task.start_date && <span>Inicio: {formatDate(task.start_date)}</span>}
          {task.start_date && task.end_date && <span> · </span>}
          {task.end_date && <span>Término: {formatDate(task.end_date)}</span>}
          {due === 'overdue' && <span className={`${badgeClass} bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200`}>Vencida</span>}
          {due === 'today' && <span className={`${badgeClass} bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200`}>Vence hoy</span>}
        </div>}
      </div>
      {/* Icon actions (UX-07): the accessible name carries the task title so a
          screen reader can tell the rows apart; title gives the mouse tooltip. */}
      <div className="task-actions flex shrink-0 gap-1 ms-auto">
        <Button ref={editButton} className="icon-button border-transparent bg-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100" disabled={busy}
          aria-label={`Modificar: ${task.title}`} title="Modificar" onClick={startEditing}><PencilIcon /></Button>
        <Button data-variant="destructive" className="icon-button border-transparent bg-transparent" disabled={busy}
          aria-label={`Eliminar: ${task.title}`} title="Eliminar" onClick={() => void remove()}><TrashIcon /></Button>
      </div>
    </div>}
  </li>;
}
