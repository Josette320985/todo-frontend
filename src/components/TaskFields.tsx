import { Field, FieldError, FieldLabel } from '@ui-sdk/react/field';
import { Input } from '@ui-sdk/react/input';
import { Textarea } from '@ui-sdk/react/textarea';
import { validateDate, validateDates } from '../lib/dates';
import { validateDescription, validateTitle } from '../lib/validation';
export interface TaskDraft { title: string; description: string; start: string; end: string }
interface Props { value: TaskDraft; onChange: (value: TaskDraft) => void; errors?: Record<string, string>; disabled?: boolean; editing?: boolean }
const labelClass = 'text-xs font-medium text-neutral-500 dark:text-neutral-400';
export default function TaskFields({ value, onChange, errors = {}, disabled, editing }: Props) {
  const titleError = (value.title ? validateTitle(value.title) : '') || errors.title;
  const descriptionError = validateDescription(value.description) || errors.description;
  const startError = validateDate(value.start) || errors.start_date;
  const dateError = validateDate(value.end) || (!validateDate(value.start) && validateDates(value.start, value.end)) || errors.end_date;
  return <div className="flex flex-col gap-3">
    <Field invalid={Boolean(titleError)} disabled={disabled}>
      <Input aria-label={editing ? 'Título de la tarea' : 'Nueva tarea'} className="h-10"
        value={value.title} onValueChange={title => onChange({ ...value, title })}
        placeholder={editing ? undefined : 'Nueva tarea...'} maxLength={200} required
        // UX-08: entering edit mode puts the cursor in the title right away.
        autoFocus={editing} />
      {titleError && <FieldError match aria-live="polite">{titleError}</FieldError>}
    </Field>
    {editing && <Field invalid={Boolean(descriptionError)} disabled={disabled}>
      <FieldLabel className={labelClass}>Descripción (opcional)</FieldLabel>
      <Textarea rows={2} autoResize value={value.description} maxLength={1000}
        onValueChange={description => onChange({ ...value, description })} />
      {descriptionError && <FieldError match aria-live="polite">{descriptionError}</FieldError>}
    </Field>}
    <div className="grid gap-3 sm:grid-cols-2">
      <Field invalid={Boolean(startError)} disabled={disabled}>
        <FieldLabel className={labelClass}>Fecha de inicio</FieldLabel>
        <Input type="date" value={value.start} min="0001-01-01" max="9999-12-31"
          onValueChange={start => onChange({ ...value, start })} />
        {startError && <FieldError match aria-live="polite">{startError}</FieldError>}
      </Field>
      <Field invalid={Boolean(dateError)} disabled={disabled}>
        <FieldLabel className={labelClass}>Fecha de término</FieldLabel>
        <Input type="date" value={value.end} min={value.start || '0001-01-01'} max="9999-12-31"
          onValueChange={end => onChange({ ...value, end })} />
        {dateError && <FieldError match aria-live="polite">{dateError}</FieldError>}
      </Field>
    </div>
  </div>;
}
