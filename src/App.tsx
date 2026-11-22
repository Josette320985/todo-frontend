import type { JSX } from 'react';
import { Container, Navbar, Button } from 'react-bootstrap';
import { useAuth } from './hooks/useAuth';
import LoginForm from './components/LoginForm';
import TaskList from './components/TaskList';

/**
 * Application shell: navbar plus the login form or the task list.
 * The session itself lives in AuthProvider (ARQ-08).
 */
export default function App(): JSX.Element {
  const { isLoggedIn, userEmail, logout } = useAuth();

  return (
    <div className="bg-light min-vh-100 pb-5">
      <Navbar bg="dark" variant="dark" className="mb-4">
        <Container className="d-flex align-items-center">
          <Navbar.Brand className="me-auto">Mis Tareas</Navbar.Brand>
          {isLoggedIn && (
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
              <Button variant="outline-light" size="sm" onClick={() => void logout()}>
                Cerrar Sesión
              </Button>
            </div>
          )}
        </Container>
      </Navbar>
      <Container>
        {isLoggedIn ? <TaskList /> : <LoginForm />}
      </Container>
    </div>
  );
}
