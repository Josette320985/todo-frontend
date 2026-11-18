import { type JSX, useEffect, useState } from 'react';
import { Container, Navbar, Button } from 'react-bootstrap';
import api, { AUTH_UNAUTHORIZED_EVENT } from './api/client';
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
   * Logs out the current user: revokes the token on the server
   * (best effort) and always clears the local session.
   */
  const logout = async (): Promise<void> => {
    await api.post('/v1/auth/logout').catch(() => undefined);
    localStorage.removeItem('token');
    setLoggedIn(false);
  };

  // Automatically log out when the API client detects an expired/invalid 401 token.
  useEffect((): (() => void) => {
    const handleUnauthorized = (): void => {
      setLoggedIn(false);
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return (): void => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

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
