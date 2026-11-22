import * as auth from './api/auth';
import { getToken } from './api/token';
import { type JSX, useEffect, useState } from 'react';
import { Container, Navbar, Button } from 'react-bootstrap';
import { AUTH_UNAUTHORIZED_EVENT } from './api/client';
import LoginForm from './components/LoginForm';
import TaskList from './components/TaskList';
import type { UserRead } from './types/auth';

/**
 * Main application component responsible for authentication state
 * and conditional rendering of the To-Do List interface.
 */
export default function App(): JSX.Element {
  // Initializes the login state based on whether a token is stored.
  const [loggedIn, setLoggedIn] = useState<boolean>(
    !!getToken(),
  );
  const [userEmail, setUserEmail] = useState<string | null>(null);

  /**
   * Logs out the current user: revokes the token on the server
   * (best effort) and always clears the local session.
   */
  const logout = async (): Promise<void> => {
    await auth.logout().catch(() => undefined);
    setLoggedIn(false);
    setUserEmail(null);
  };

  // Automatically log out when the API client detects an expired/invalid 401 token.
  useEffect((): (() => void) => {
    const handleUnauthorized = (): void => {
      setLoggedIn(false);
      setUserEmail(null);
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return (): void => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  useEffect((): (() => void) => {
    let active = true;

    if (loggedIn) {
      void auth
        .getCurrentUser()
        .then((user: UserRead): void => {
          if (active) {
            setUserEmail(user.email);
          }
        })
        .catch((): void => {
          if (active) {
            setUserEmail(null);
          }
        });
    }

    return (): void => {
      active = false;
    };
  }, [loggedIn]);

  return (
    <div className="bg-light min-vh-100 pb-5">
      <Navbar bg="dark" variant="dark" className="mb-4">
        <Container className="d-flex align-items-center">
          <Navbar.Brand className="me-auto">Mis Tareas</Navbar.Brand>
          {loggedIn && (
            <div className="d-flex align-items-center gap-3">
              {userEmail && (
                <Navbar.Text
                  className="small text-truncate d-inline-block"
                  title={userEmail}
                  style={{ maxWidth: '16rem' }}
                >
                  {userEmail}
                </Navbar.Text>
              )}
              <Button variant="outline-light" size="sm" onClick={logout}>
                Cerrar Sesión
              </Button>
            </div>
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
