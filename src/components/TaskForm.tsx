import { useState, type FormEvent } from 'react';
import { Form, InputGroup, Button, Row, Col } from 'react-bootstrap';
import { validateDates } from '../lib/dates';
import type { TaskCreate } from '../types/task';
interface Props { onCreate: (data: TaskCreate) => Promise<boolean>; onError: (message: string) => void }
export default function TaskForm({ onCreate, onError }: Props) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const addTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    const error = validateDates(startDate, endDate);
    if (error) { onError(error); return; }
    if (await onCreate({ title, start_date: startDate || null, end_date: endDate || null })) {
      setTitle(''); setStartDate(''); setEndDate('');
    }
  };
  return (
<Form onSubmit={addTask} className="mb-4">
<InputGroup className="mb-2">
  <Form.Control
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="Nueva tarea..."
  />
  <Button type="submit" variant="success">
    Agregar
  </Button>
</InputGroup>
<Row className="g-2">
  <Col xs={12} sm={6}>
    <Form.Label className="small text-muted mb-0">
      Fecha de inicio
    </Form.Label>
    <Form.Control
      type="date"
      size="sm"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
    />
  </Col>
  <Col xs={12} sm={6}>
    <Form.Label className="small text-muted mb-0">
      Fecha de término
    </Form.Label>
    <Form.Control
      type="date"
      size="sm"
      value={endDate}
      min={startDate || undefined}
      onChange={(e) => setEndDate(e.target.value)}
    />
  </Col>
</Row>
        </Form>
  );
}
