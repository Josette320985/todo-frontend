
import { useState } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import api from '../api/client';

/**
 * Renders the authentication form for user login and registration.
 *
 * Supports two modes:
 * - Login: authenticates an existing user.
 * - Registration: creates a new account and automatically logs in.
 *
 * After successful authentication, stores the access token in
 * localStorage and notifies the parent component through onLogin().
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {Function} props.onLogin - Callback executed after
 *   successful authentication. Receives no arguments.
 * @returns {JSX.Element} A Bootstrap card containing the
 *   authentication form and conditional error messages.
 */
export default function LoginForm({ onLogin }) {
  // Determines whether the form is in login or registration mode.
  const [isRegister, setIsRegister] = useState(false);

  // Controlled form inputs. Email is submitted as "username" during login.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Stores authentication errors displayed to the user.
  const [error, setError] = useState('');

  /**
   * Handles login and registration form submissions.
   *
   * Prevents default form submission and clears previous errors.
   * In registration mode, creates a new account before attempting login.
   *
   * Sends login credentials as URL-encoded form data using the
   * "username" and "password" fields.
   *
   * On success, saves the access token in localStorage and calls
   * onLogin(). On failure, displays the API error message or a
   * fallback connection error.
   *
   * @async
   * @param {React.FormEvent<HTMLFormElement>} e - Form submission event.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await api.post('/v1/auth/register', { email, password });
      }
      
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      
      const { data } = await api.post('/v1/auth/login', params);
      localStorage.setItem('token', data.access_token);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al conectar con el servidor');
    }
  };

  return (
    <Card className="mx-auto mt-5" style={{ maxWidth: '400px' }}>
      <Card.Body>
        <h3 className="text-center mb-4">{isRegister ? 'Registro' : 'Iniciar Sesión'}</h3>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Form.Group>
          <Button type="submit" variant="primary" className="w-100 mb-3">
            {isRegister ? 'Registrarse y Entrar' : 'Entrar'}
          </Button>
          <div className="text-center">
            <Button variant="link" size="sm" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
