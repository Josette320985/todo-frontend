import { Form, Row, Col } from 'react-bootstrap';
import { useId } from 'react';
import { validateDates } from '../lib/dates';
export interface TaskDraft { title: string; description: string; start: string; end: string }
interface Props { value: TaskDraft; onChange: (value: TaskDraft) => void; errors?: Record<string, string>; disabled?: boolean; editing?: boolean }
export default function TaskFields({ value, onChange, errors = {}, disabled, editing }: Props) {
  const id = useId();
  const dateError = validateDates(value.start, value.end) || errors.end_date;
  return <>
    <Form.Control id={`${id}-title`} aria-label={editing ? 'Título de la tarea' : 'Nueva tarea'}
      value={value.title} onChange={event => onChange({ ...value, title: event.target.value })}
      placeholder={editing ? undefined : 'Nueva tarea...'} maxLength={200} required
      // UX-08: entering edit mode puts the cursor in the title right away.
      autoFocus={editing}
      disabled={disabled} isInvalid={Boolean(errors.title)} aria-describedby={errors.title ? `${id}-title-error` : undefined} />
    <Form.Control.Feedback type="invalid" id={`${id}-title-error`} aria-live="polite">{errors.title}</Form.Control.Feedback>
    {editing && <>
      <Form.Label htmlFor={`${id}-description`} className="small text-muted mb-0 mt-2">Descripción (opcional)</Form.Label>
      <Form.Control id={`${id}-description`} as="textarea" rows={2} value={value.description} maxLength={1000}
        disabled={disabled} isInvalid={Boolean(errors.description)}
        aria-describedby={errors.description ? `${id}-description-error` : undefined}
        onChange={event => onChange({ ...value, description: event.target.value })} />
      <Form.Control.Feedback type="invalid" id={`${id}-description-error`} aria-live="polite">{errors.description}</Form.Control.Feedback>
    </>}
    <Row className="g-2 mt-1">
      <Col xs={12} sm={6}>
        <Form.Label htmlFor={`${id}-start`} className="small text-muted mb-0">Fecha de inicio</Form.Label>
        <Form.Control id={`${id}-start`} type="date" size="sm" value={value.start} disabled={disabled}
          min="0001-01-01" max="9999-12-31" isInvalid={Boolean(errors.start_date)}
          aria-describedby={errors.start_date ? `${id}-start-error` : undefined}
          onChange={event => onChange({ ...value, start: event.target.value })} />
        <Form.Control.Feedback type="invalid" id={`${id}-start-error`} aria-live="polite">{errors.start_date}</Form.Control.Feedback>
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
