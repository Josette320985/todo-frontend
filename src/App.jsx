import { useState } from 'react';
import { Container, Navbar, Button } from 'react-bootstrap';
import LoginForm from './components/LoginForm';
import TaskList from './components/TaskList';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));

  const logout = () => {
    localStorage.removeItem('token');
    setLoggedIn(false);
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      <Navbar bg="dark" variant="dark" className="mb-4">
        <Container>
          <Navbar.Brand>To-Do List - Equipo 1</Navbar.Brand>
          {loggedIn && <Button variant="outline-light" size="sm" onClick={logout}>Cerrar Sesión</Button>}
        </Container>
      </Navbar>
      <Container>
        {loggedIn ? <TaskList /> : <LoginForm onLogin={() => setLoggedIn(true)} />}
      </Container>
    </div>
  );
}