import { useId, useState, type FormEvent } from 'react';
import { Button } from '@ui-sdk/react/button';
import { validateDates } from '../lib/dates';
import { validateTitle } from '../lib/validation';
import { TASK_LIMIT_MESSAGE } from '../lib/limits';
import { mutedTextClass } from '../lib/ui';
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
  return <form onSubmit={addTask} className="mb-6 flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
    <TaskFields value={value} onChange={setValue} errors={fieldErrors} disabled={pending} />
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit" data-variant="solid" className="h-9 px-4" disabled={Boolean(invalid || pending || cooldown || atLimit)}
        aria-describedby={atLimit ? limitId : undefined}>
        {pending ? 'Guardando...' : cooldown ? `Espera ${cooldown} s` : 'Agregar'}
      </Button>
      {/* SEG-H12: warn before the backend answers 409 at the per-user cap. */}
      {atLimit && <p id={limitId} className={mutedTextClass} role="status">{TASK_LIMIT_MESSAGE}</p>}
    </div>
  </form>;
}
