import { useEffect, useState } from 'react';
import { ListGroup, Button, Form, InputGroup, Card, Row, Col, Alert } from 'react-bootstrap';
import api from '../api/client';

// Convierte "2026-11-12" en "12/11/2026" sin usar Date
// (evita el desfase de un día por zona horaria).
function formatDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

// Devuelve un mensaje de error si las fechas son inválidas, o '' si están bien.
function validateDates(start, end) {
  if (start && end && end < start) {
    return 'La fecha de término no puede ser anterior a la fecha de inicio.';
  }
  return '';
}

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');

  // Formulario de nueva tarea
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Edición
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  const loadTasks = async () => {
    try {
      const { data } = await api.get('/v1/tasks/');
      setTasks(data);
    } catch (err) {
      console.error('Error cargando tareas', err);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dateError = validateDates(startDate, endDate);
    if (dateError) {
      setError(dateError);
      return;
    }

    try {
      await api.post('/v1/tasks/', {
        title,
        start_date: startDate || null,
        end_date: endDate || null,
      });
      setTitle('');
      setStartDate('');
      setEndDate('');
      setError('');
      loadTasks();
    } catch (err) {
      console.error('Error creando tarea', err);
      setError('No se pudo crear la tarea. Revisa los datos.');
    }
  };

  const toggleTask = async (task) => {
    await api.put(`/v1/tasks/${task.id}`, { completed: !task.completed });
    loadTasks();
  };

  const deleteTask = async (id) => {
    await api.delete(`/v1/tasks/${id}`);
    loadTasks();
  };

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditStartDate(task.start_date || '');
    setEditEndDate(task.end_date || '');
    setError('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setError('');
  };

  const updateTask = async (id) => {
    if (!editTitle.trim()) return;

    const dateError = validateDates(editStartDate, editEndDate);
    if (dateError) {
      setError(dateError);
      return;
    }

    try {
      await api.put(`/v1/tasks/${id}`, {
        title: editTitle,
        start_date: editStartDate || null,
        end_date: editEndDate || null,
      });
      setEditingId(null);
      setEditTitle('');
      setEditStartDate('');
      setEditEndDate('');
      setError('');
      loadTasks();
    } catch (err) {
      console.error('Error actualizando tarea', err);
      setError('No se pudo actualizar la tarea. Revisa los datos.');
    }
  };

  return (
    <Card className="mx-auto mt-5 shadow-sm" style={{ maxWidth: '600px' }}>
      <Card.Body>
        <h3 className="mb-4">Mis Tareas</h3>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Form onSubmit={addTask} className="mb-4">
          <InputGroup className="mb-2">
            <Form.Control
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nueva tarea..."
            />
            <Button type="submit" variant="success">Agregar</Button>
          </InputGroup>
          <Row className="g-2">
            <Col xs={12} sm={6}>
              <Form.Label className="small text-muted mb-0">Fecha de inicio</Form.Label>
              <Form.Control
                type="date"
                size="sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Form.Label className="small text-muted mb-0">Fecha de término</Form.Label>
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

        <ListGroup>
          {tasks.length === 0 && (
            <p className="text-muted text-center">No hay tareas pendientes.</p>
          )}

          {tasks.map((task) => (
            <ListGroup.Item key={task.id}>
              {editingId === task.id ? (
                <div className="w-100">
                  <Form.Control
                    size="sm"
                    className="mb-2"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <Row className="g-2 mb-2">
                    <Col xs={12} sm={6}>
                      <Form.Label className="small text-muted mb-0">Fecha de inicio</Form.Label>
                      <Form.Control
                        type="date"
                        size="sm"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Form.Label className="small text-muted mb-0">Fecha de término</Form.Label>
                      <Form.Control
                        type="date"
                        size="sm"
                        value={editEndDate}
                        min={editStartDate || undefined}
                        onChange={(e) => setEditEndDate(e.target.value)}
                      />
                    </Col>
                  </Row>
                  <div className="d-flex gap-2">
                    <Button variant="success" size="sm" onClick={() => updateTask(task.id)}>
                      Guardar
                    </Button>
                    <Button variant="secondary" size="sm" onClick={cancelEditing}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Form.Check
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task)}
                      label={
                        <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                          {task.title}
                        </span>
                      }
                    />
                    {(task.start_date || task.end_date) && (
                      <div className="small text-muted ms-4">
                        {task.start_date && <span>Inicio: {formatDate(task.start_date)}</span>}
                        {task.start_date && task.end_date && <span> · </span>}
                        {task.end_date && <span>Término: {formatDate(task.end_date)}</span>}
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <Button variant="outline-warning" size="sm" onClick={() => startEditing(task)}>
                      Modificar
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => deleteTask(task.id)}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );
}