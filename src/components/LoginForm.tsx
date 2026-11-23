import { useState, type FormEvent } from 'react';
import { Button } from '@ui-sdk/react/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@ui-sdk/react/field';
import { Input } from '@ui-sdk/react/input';
import { PasswordInput, PasswordInputControl, PasswordInputToggle } from '@ui-sdk/react/password-input';
import { getApiError, getFormErrorMessage } from '../api/errors';
import { validateEmail, validatePassword } from '../lib/validation';
import { validateRegistrationEmail } from '../api/auth';
import { useCooldown } from '../hooks/useCooldown';
import { useAuth } from '../hooks/useAuth';
import { cardClass, mutedTextClass } from '../lib/ui';
import Alert from './Alert';

export default function LoginForm() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const { remaining, start } = useCooldown();
  const passwordError = isRegister && password ? validatePassword(password) : '';
  const emailError = isRegister ? validateEmail(email) || fields.email || fields.username || '' : '';
  const shownEmailError = (email && emailError) || fields.email || fields.username || '';
  const shownPasswordError = passwordError || fields.password || '';
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || remaining || (isRegister && (emailError || validatePassword(password)))) return;
    setPending(true); setError(''); setFields({});
    try {
      let submittedEmail = email.trim();
      if (isRegister) {
        const result = await validateRegistrationEmail(submittedEmail);
        if (!result.valid) { setFields({ email: result.message }); return; }
        submittedEmail = result.normalized;
        await register({ email: submittedEmail, password }); setIsRegister(false);
      }
      await login(submittedEmail, password);
    } catch (err) {
      const info = getApiError(err); setError(getFormErrorMessage(info, ['email', 'username', 'password'])); setFields(info.fieldErrors); start(info.retryAfter);
    } finally { setPending(false); }
  };
  return <section className={`${cardClass} max-w-md`}>
    <h3 className="auth-title mb-1 text-center text-2xl font-semibold tracking-tight">
      <span className={`auth-title-option${isRegister ? '' : ' is-active'}`} aria-hidden={isRegister}>Iniciar Sesión</span>
      <span className={`auth-title-option${isRegister ? ' is-active' : ''}`} aria-hidden={!isRegister}>Registro</span>
    </h3>
    <p className={`${mutedTextClass} mb-6 text-center`}>
      {isRegister ? 'Crea tu cuenta para guardar tus tareas.' : 'Entra para ver tus tareas.'}
    </p>
    {error && <Alert className="mb-4">{error}</Alert>}
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field invalid={Boolean(shownEmailError)} disabled={pending}>
        <FieldLabel>Email</FieldLabel>
        <Input type="text" inputMode="email" autoCapitalize="none" spellCheck={false} value={email} required autoComplete="email" maxLength={2048}
          onValueChange={value => { setEmail(value); setFields({}); }} />
        {shownEmailError && <FieldError match aria-live="polite">{shownEmailError}</FieldError>}
      </Field>
      <Field invalid={Boolean(shownPasswordError)} disabled={pending}>
        <FieldLabel>Contraseña</FieldLabel>
        <PasswordInput value={password} required autoComplete={isRegister ? 'new-password' : 'current-password'}
          onValueChange={value => { setPassword(value); setFields({}); }}>
          <PasswordInputControl />
          <PasswordInputToggle aria-label="Mostrar contraseña" />
        </PasswordInput>
        {isRegister && <FieldDescription>Mínimo 8 caracteres, con al menos una letra y un número. Máximo 72 bytes UTF-8.</FieldDescription>}
        {shownPasswordError && <FieldError match aria-live="polite">{shownPasswordError}</FieldError>}
      </Field>
      <Button type="submit" data-variant="solid" className="mt-2 h-10 w-full" disabled={Boolean(pending || remaining || passwordError || emailError)}>
        {pending ? (isRegister ? 'Creando cuenta…' : 'Entrando…') : remaining ? `Espera ${remaining} s` : <span className="auth-action">
          <span className={`auth-action-option${isRegister ? '' : ' is-active'}`} aria-hidden={isRegister}>Entrar</span>
          <span className={`auth-action-option${isRegister ? ' is-active' : ''}`} aria-hidden={!isRegister}>Registrarse y Entrar</span>
        </span>}
      </Button>
      <Button className="mx-auto border-transparent bg-transparent text-[var(--ui-primary)] underline-offset-4 hover:underline" disabled={pending}
        onClick={() => { setIsRegister(!isRegister); setFields({}); setError(''); }}>
        {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
      </Button>
    </form>
  </section>;
}
