import { useState } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import api from '../api/client';

export default function LoginForm({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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