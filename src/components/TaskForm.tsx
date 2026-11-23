import { useId, useState, type FormEvent } from 'react';
import { Form, Button } from 'react-bootstrap';
import { validateDates } from '../lib/dates';
import { validateTitle } from '../lib/validation';
import { TASK_LIMIT_MESSAGE } from '../lib/limits';
import type { TaskCreate } from '../types/task';
import TaskFields, { type TaskDraft } from './TaskFields';
interface Props { onCreate: (data: TaskCreate) => Promise<boolean>; onError: (message: string) => void; fieldErrors?: Record<string, string>; cooldown?: number; atLimit?: boolean }
export default function TaskForm({ onCreate, onError, fieldErrors, cooldown = 0, atLimit = false }: Props) {
  const limitId = useId();
  const [value, setValue] = useState<TaskDraft>({ title: '', description: '', start: '', end: '' });
  const [pending, setPending] = useState(false);
  const invalid = Boolean(validateTitle(value.title) || validateDates(value.start, value.end));
  const addTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (invalid || pending || cooldown || atLimit) return;
    setPending(true); onError('');
    try {
      if (await onCreate({ title: value.title.trim(), start_date: value.start || null, end_date: value.end || null })) {
        setValue({ title: '', description: '', start: '', end: '' });
      }
    } finally { setPending(false); }
  };
  return <Form onSubmit={addTask} className="mb-4">
    <TaskFields value={value} onChange={setValue} errors={fieldErrors} disabled={pending} />
    <Button type="submit" variant="success" className="mt-2" disabled={Boolean(invalid || pending || cooldown || atLimit)}
      aria-describedby={atLimit ? limitId : undefined}>
      {pending ? 'Guardando...' : cooldown ? `Espera ${cooldown} s` : 'Agregar'}
    </Button>
    {/* SEG-H12: warn before the backend answers 409 at the per-user cap. */}
    {atLimit && <p id={limitId} className="small text-muted mt-2 mb-0" role="status">{TASK_LIMIT_MESSAGE}</p>}
  </Form>;
}
