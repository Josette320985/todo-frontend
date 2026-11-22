import { useState, type FormEvent } from 'react';
import { Form, Button } from 'react-bootstrap';
import { validateDates } from '../lib/dates';
import type { TaskCreate } from '../types/task';
import TaskFields, { type TaskDraft } from './TaskFields';
interface Props { onCreate: (data: TaskCreate) => Promise<boolean>; onError: (message: string) => void; fieldErrors?: Record<string, string>; cooldown?: number }
export default function TaskForm({ onCreate, onError, fieldErrors, cooldown = 0 }: Props) {
  const [value, setValue] = useState<TaskDraft>({ title: '', description: '', start: '', end: '' });
  const [pending, setPending] = useState(false);
  const invalid = !value.title.trim() || Boolean(validateDates(value.start, value.end));
  const addTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (invalid || pending || cooldown) return;
    setPending(true); onError('');
    try {
      if (await onCreate({ title: value.title.trim(), start_date: value.start || null, end_date: value.end || null })) {
        setValue({ title: '', description: '', start: '', end: '' });
      }
    } finally { setPending(false); }
  };
  return <Form onSubmit={addTask} className="mb-4">
    <TaskFields value={value} onChange={setValue} errors={fieldErrors} disabled={pending} />
    <Button type="submit" variant="success" className="mt-2" disabled={Boolean(invalid || pending || cooldown)}>
      {pending ? 'Guardando...' : cooldown ? `Espera ${cooldown} s` : 'Agregar'}
    </Button>
  </Form>;
}
