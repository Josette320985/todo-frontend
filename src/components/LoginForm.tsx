import { useState, type FormEvent } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import * as auth from '../api/auth';
import { getApiError } from '../api/errors';
import { validatePassword } from '../lib/validation';
import { useCooldown } from '../hooks/useCooldown';
export interface LoginFormProps { onLogin: () => void }

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const { remaining, start } = useCooldown();
  const passwordError = isRegister && password ? validatePassword(password) : '';
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || remaining || (isRegister && validatePassword(password))) return;
    setPending(true); setError(''); setFields({});
    try {
      if (isRegister) { await auth.register({ email: email.trim(), password }); setIsRegister(false); }
      await auth.login(email.trim(), password); onLogin();
    } catch (err) {
      const info = getApiError(err); setError(info.message); setFields(info.fieldErrors); start(info.retryAfter);
    } finally { setPending(false); }
  };
  return <Card className="mx-auto mt-5" style={{ maxWidth: '400px' }}><Card.Body>
    <h3 className="text-center mb-4 auth-title">
      <span className={`auth-title-option${isRegister ? '' : ' is-active'}`} aria-hidden={isRegister}>Iniciar Sesión</span>
      <span className={`auth-title-option${isRegister ? ' is-active' : ''}`} aria-hidden={!isRegister}>Registro</span>
    </h3>
    {error && <Alert variant="danger">{error}</Alert>}
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3" controlId="auth-email">
        <Form.Label>Email</Form.Label>
        <Form.Control type="email" value={email} required maxLength={254} disabled={pending}
          isInvalid={Boolean(fields.email || fields.username)} aria-describedby="email-error"
          onChange={event => { setEmail(event.target.value); setFields({}); }} />
        <Form.Control.Feedback type="invalid" id="email-error">{fields.email || fields.username}</Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3" controlId="auth-password">
        <Form.Label>Contraseña</Form.Label>
        <Form.Control type="password" value={password} required disabled={pending}
          isInvalid={Boolean(passwordError || fields.password)} aria-describedby="password-help password-error"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          onChange={event => { setPassword(event.target.value); setFields({}); }} />
        {isRegister && <Form.Text id="password-help">Mínimo 8 caracteres, con al menos una letra y un número. Máximo 72 bytes UTF-8.</Form.Text>}
        <Form.Control.Feedback type="invalid" id="password-error">{passwordError || fields.password}</Form.Control.Feedback>
      </Form.Group>
      <Button type="submit" variant="primary" className="w-100 mb-3" disabled={Boolean(pending || remaining || passwordError)}>
        {pending ? 'Enviando...' : remaining ? `Espera ${remaining} s` : <span className="auth-action">
          <span className={`auth-action-option${isRegister ? '' : ' is-active'}`} aria-hidden={isRegister}>Entrar</span>
          <span className={`auth-action-option${isRegister ? ' is-active' : ''}`} aria-hidden={!isRegister}>Registrarse y Entrar</span>
        </span>}
      </Button>
      <div className="text-center"><Button variant="link" size="sm" disabled={pending} onClick={() => { setIsRegister(!isRegister); setFields({}); setError(''); }}>
        {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
      </Button></div>
    </Form>
  </Card.Body></Card>;
}
