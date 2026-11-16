import { type FormEvent, type JSX, useState } from 'react';
import { type AxiosError } from 'axios';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import api from '../api/client';
import type {
  ApiErrorResponse,
  TokenResponse,
  UserCreate,
  UserRead,
} from '../types/auth';

export interface LoginFormProps {
  onLogin: () => void;
}

/**
 * Renders the authentication form for user login and registration.
 *
 * Supports two modes:
 * - Login: authenticates an existing user.
 * - Registration: creates a new account and automatically logs in.
 *
 * After successful authentication, stores the access token in
 * localStorage and notifies the parent component through onLogin().
 */
export default function LoginForm({ onLogin }: LoginFormProps): JSX.Element {
  // Determines whether the form is in login or registration mode.
  const [isRegister, setIsRegister] = useState<boolean>(false);

  // Controlled form inputs. Email is submitted as "username" during login.
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Stores authentication errors displayed to the user.
  const [error, setError] = useState<string>('');

  /**
   * Handles login and registration form submissions.
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        const registerPayload: UserCreate = { email, password };
        await api.post<UserRead>('/v1/auth/register', registerPayload);
      }

      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const { data } = await api.post<TokenResponse>('/v1/auth/login', params);
      localStorage.setItem('token', data.access_token);
      onLogin();
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setError(
        axiosErr.response?.data?.detail || 'Error al conectar con el servidor',
      );
    }
  };

  return (
    <Card className="mx-auto mt-5" style={{ maxWidth: '400px' }}>
      <Card.Body>
        <h3 className="text-center mb-4">
          {isRegister ? 'Registro' : 'Iniciar Sesión'}
        </h3>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>
          <Button type="submit" variant="primary" className="w-100 mb-3">
            {isRegister ? 'Registrarse y Entrar' : 'Entrar'}
          </Button>
          <div className="text-center">
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister
                ? '¿Ya tienes cuenta? Inicia sesión'
                : '¿No tienes cuenta? Regístrate'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
