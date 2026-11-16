import { type JSX, useState } from 'react';
import { Container, Navbar, Button } from 'react-bootstrap';
import LoginForm from './components/LoginForm';
import TaskList from './components/TaskList';

/**
 * Main application component responsible for authentication state
 * and conditional rendering of the To-Do List interface.
 */
export default function App(): JSX.Element {
  // Initializes the login state based on whether a token is stored.
  const [loggedIn, setLoggedIn] = useState<boolean>(
    !!localStorage.getItem('token'),
  );

  /**
   * Logs out the current user.
   */
  const logout = (): void => {
    localStorage.removeItem('token');
    setLoggedIn(false);
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      <Navbar bg="dark" variant="dark" className="mb-4">
        <Container>
          <Navbar.Brand>To-Do List - Equipo 1</Navbar.Brand>
          {loggedIn && (
            <Button variant="outline-light" size="sm" onClick={logout}>
              Cerrar Sesión
            </Button>
          )}
        </Container>
      </Navbar>
      <Container>
        {loggedIn ? (
          <TaskList />
        ) : (
          <LoginForm onLogin={() => setLoggedIn(true)} />
        )}
      </Container>
    </div>
  );
}
