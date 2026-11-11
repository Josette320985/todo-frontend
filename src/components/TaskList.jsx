import { useEffect, useState } from 'react';
import { ListGroup, Button, Form, InputGroup, Card } from 'react-bootstrap';
import api from '../api/client';

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');

  const loadTasks = async () => {
    try {
      const { data } = await api.get('/v1/tasks/');
      setTasks(data);
    } catch (error) {
      console.error("Error cargando tareas", error);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await api.post('/v1/tasks/', { title });
    setTitle('');
    loadTasks();
  };

  const toggleTask = async (task) => {
    await api.put(`/v1/tasks/${task.id}`, { completed: !task.completed });
    loadTasks();
  };

  const deleteTask = async (id) => {
    await api.delete(`/v1/tasks/${id}`);
    loadTasks();
  };

  return (
    <Card className="mx-auto mt-5 shadow-sm" style={{ maxWidth: '600px' }}>
      <Card.Body>
        <h3 className="mb-4">Mis Tareas</h3>
        <Form onSubmit={addTask} className="mb-4">
          <InputGroup>
            <Form.Control value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nueva tarea..." />
            <Button type="submit" variant="success">Agregar</Button>
          </InputGroup>
        </Form>
        <ListGroup>
          {tasks.length === 0 && <p className="text-muted text-center">No hay tareas pendientes.</p>}
          {tasks.map((task) => (
            <ListGroup.Item key={task.id} className="d-flex justify-content-between align-items-center">
              <Form.Check
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task)}
                label={<span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</span>}
              />
              <Button variant="outline-danger" size="sm" onClick={() => deleteTask(task.id)}>Eliminar</Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );
}