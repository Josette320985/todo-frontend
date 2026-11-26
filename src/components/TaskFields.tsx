import { Form, Row, Col } from 'react-bootstrap';
import { useId } from 'react';
import { validateDate, validateDates } from '../lib/dates';
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from '../lib/limits';
import { validateDescription, validateTitle } from '../lib/validation';
export interface TaskDraft { title: string; description: string; start: string; end: string }
interface Props { value: TaskDraft; onChange: (value: TaskDraft) => void; errors?: Record<string, string>; disabled?: boolean; editing?: boolean }
export default function TaskFields({ value, onChange, errors = {}, disabled, editing }: Props) {
  const id = useId();
  const titleLength = Array.from(value.title).length;
  const descriptionLength = Array.from(value.description).length;
  const titleError = (value.title ? validateTitle(value.title) : '') || errors.title;
  const descriptionError = validateDescription(value.description) || errors.description;
  const startError = validateDate(value.start) || errors.start_date;
  const dateError = validateDate(value.end) || (!validateDate(value.start) && validateDates(value.start, value.end)) || errors.end_date;
  return <>
    <Form.Control id={`${id}-title`} aria-label={editing ? 'Título de la tarea' : 'Nueva tarea'}
      value={value.title} onChange={event => onChange({ ...value, title: event.target.value })}
      placeholder={editing ? undefined : 'Nueva tarea...'} maxLength={MAX_TITLE_LENGTH} required
      // UX-08: entering edit mode puts the cursor in the title right away.
      autoFocus={editing}
      disabled={disabled} isInvalid={Boolean(titleError)}
      aria-describedby={`${titleError ? `${id}-title-error ` : ''}${id}-title-count`} />
    <Form.Control.Feedback type="invalid" id={`${id}-title-error`} aria-live="polite">{titleError}</Form.Control.Feedback>
    <div className="d-flex justify-content-end mt-1">
      <Form.Text id={`${id}-title-count`} className={titleLength >= MAX_TITLE_LENGTH ? 'text-warning-emphasis fw-semibold' : undefined}>
        {titleLength}/{MAX_TITLE_LENGTH}
      </Form.Text>
    </div>
    {editing && <>
      <div className="d-flex justify-content-between align-items-baseline mt-2">
        <Form.Label htmlFor={`${id}-description`} className="small text-muted mb-0">Descripción (opcional)</Form.Label>
        <Form.Text id={`${id}-description-count`} className={descriptionLength >= MAX_DESCRIPTION_LENGTH ? 'text-warning-emphasis fw-semibold' : undefined}>
          {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
        </Form.Text>
      </div>
      <Form.Control id={`${id}-description`} as="textarea" rows={2} value={value.description} maxLength={MAX_DESCRIPTION_LENGTH}
        disabled={disabled} isInvalid={Boolean(descriptionError)}
        aria-describedby={`${descriptionError ? `${id}-description-error ` : ''}${id}-description-count`}
        onChange={event => onChange({ ...value, description: event.target.value })} />
      <Form.Control.Feedback type="invalid" id={`${id}-description-error`} aria-live="polite">{descriptionError}</Form.Control.Feedback>
    </>}
    <Row className="g-2 mt-1">
      <Col xs={12} sm={6}>
        <Form.Label htmlFor={`${id}-start`} className="small text-muted mb-0">Fecha de inicio</Form.Label>
        <Form.Control id={`${id}-start`} type="date" size="sm" value={value.start} disabled={disabled}
          min="0001-01-01" max="9999-12-31" isInvalid={Boolean(startError)}
          aria-describedby={startError ? `${id}-start-error` : undefined}
          onChange={event => onChange({ ...value, start: event.target.value })} />
        <Form.Control.Feedback type="invalid" id={`${id}-start-error`} aria-live="polite">{startError}</Form.Control.Feedback>
      </Col>
      <Col xs={12} sm={6}>
        <Form.Label htmlFor={`${id}-end`} className="small text-muted mb-0">Fecha de término</Form.Label>
        <Form.Control id={`${id}-end`} type="date" size="sm" value={value.end} disabled={disabled}
          min={value.start || '0001-01-01'} max="9999-12-31" isInvalid={Boolean(dateError)}
          aria-describedby={dateError ? `${id}-end-error` : undefined}
          onChange={event => onChange({ ...value, end: event.target.value })} />
        <Form.Control.Feedback type="invalid" id={`${id}-end-error`} aria-live="polite">{dateError}</Form.Control.Feedback>
      </Col>
    </Row>
  </>;
}
