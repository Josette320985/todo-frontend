
import { useState } from 'react';
import { Container, Navbar, Button } from 'react-bootstrap';
import LoginForm from './components/LoginForm';
import TaskList from './components/TaskList';

/**
 * Main application component responsible for authentication state
 * and conditional rendering of the To-Do List interface.
 *
 * Initializes the authentication state based on the presence of
 * an access token in localStorage.
 *
 * Displays the LoginForm component when the user is not logged in
 * and the TaskList component when authentication is active.
 *
 * Provides a logout function that removes the stored token and
 * updates the interface to display the login form.
 *
 * @component
 * @returns {JSX.Element} The main application layout, including
 *   the navigation bar and authentication-dependent content.
 */
export default function App() {
  // Initializes the login state based on whether a token is stored.
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));

  /**
   * Logs out the current user.
   *
   * Removes the access token from localStorage and updates
   * the authentication state to display the login form.
   *
   * @returns {void}
   */
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
