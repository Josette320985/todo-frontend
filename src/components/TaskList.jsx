
import { useEffect, useState } from 'react';
import { ListGroup, Button, Form, InputGroup, Card } from 'react-bootstrap';
import api from '../api/client';

/**
 * Renders and manages the authenticated user's task list.
 *
 * Provides task management functionality through the backend API:
 * - Retrieves tasks when the component is mounted.
 * - Creates new tasks.
 * - Marks tasks as completed or pending.
 * - Updates existing task titles.
 * - Deletes tasks.
 *
 * Refreshes the task list after successful CRUD operations
 * to keep the interface synchronized with the backend.
 *
 * @component
 * @returns {JSX.Element} A Bootstrap card containing the task
 *   creation form, task list, and management controls.
 */
export default function TaskList() {
  // Stores the tasks retrieved from the backend.
  const [tasks, setTasks] = useState([]);

  // Stores the title entered in the new-task form.
  const [title, setTitle] = useState('');

  // Identifies the task currently being edited; null means no active edit.
  const [editingId, setEditingId] = useState(null);

  // Stores the temporary title entered while editing an existing task.
  const [editTitle, setEditTitle] = useState('');

  /**
   * Retrieves the current task list from the backend API.
   *
   * Updates the tasks state with the returned data.
   * Logs an error to the console if the request fails.
   *
   * @async
   * @returns {Promise<void>}
   */
  const loadTasks = async () => {
    try {
      const { data } = await api.get('/v1/tasks/');
      setTasks(data);
    } catch (error) {
      console.error("Error cargando tareas", error);
    }
  };

  // Loads the task list once when the component is mounted.
  useEffect(() => { loadTasks(); }, []);

  /**
   * Creates a new task using the title entered by the user.
   *
   * Prevents default form submission and ignores empty or
   * whitespace-only titles. After creating the task, clears
   * the input field and reloads the task list.
   *
   * @async
   * @param {React.FormEvent<HTMLFormElement>} e - Form submission event.
   * @returns {Promise<void>}
   */
  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await api.post('/v1/tasks/', { title });
    setTitle('');
    loadTasks();
  };

  /**
   * Toggles the completion status of an existing task.
   *
   * Sends the opposite of the task's current completed value
   * to the backend and reloads the task list afterward.
   *
   * @async
   * @param {Object} task - Task to update.
   * @param {number} task.id - Unique task identifier.
   * @param {boolean} task.completed - Current completion status.
   * @returns {Promise<void>}
   */
  const toggleTask = async (task) => {
    await api.put(`/v1/tasks/${task.id}`, { completed: !task.completed });
    loadTasks();
  };

  /**
   * Deletes a task using its unique identifier.
   *
   * Sends a DELETE request to the backend and refreshes
   * the task list after the request succeeds.
   *
   * @async
   * @param {number} id - Unique identifier of the task to delete.
   * @returns {Promise<void>}
   */
  const deleteTask = async (id) => {
    await api.delete(`/v1/tasks/${id}`);
    loadTasks();
  };

  /**
   * Updates the title of an existing task.
   *
   * Ignores empty or whitespace-only titles. On success,
   * exits editing mode, clears the temporary title, and
   * reloads the task list.
   *
   * Logs an error to the console if the update request fails.
   *
   * @async
   * @param {number} id - Unique identifier of the task to update.
   * @returns {Promise<void>}
   */
  const updateTaskTitle = async (id) => {
    if (!editTitle.trim()) return;
    try {
      await api.put(`/v1/tasks/${id}`, { title: editTitle });
      setEditingId(null);
      setEditTitle('');
      loadTasks();
    } catch (error) {
      console.error("Error actualizando tarea", error);
    }
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
              {editingId === task.id ? (
                <div className="d-flex w-100 gap-2 align-items-center">
                  <Form.Control
                    size="sm"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <Button variant="success" size="sm" onClick={() => updateTaskTitle(task.id)}>Guardar</Button>
                  <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancelar</Button>
                </div>
              ) : (
                <>
                  <Form.Check
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task)}
                    label={<span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</span>}
                  />
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-warning" 
                      size="sm" 
                      onClick={() => {
                        setEditingId(task.id);
                        setEditTitle(task.title);
                      }}
                    >
                      Modificar
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => deleteTask(task.id)}>Eliminar</Button>
                  </div>
                </>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );
}
