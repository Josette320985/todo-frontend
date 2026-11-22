import { expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../components/LoginForm';
import { renderWithAuth } from './renderWithAuth';
import TaskForm from '../components/TaskForm';
import * as auth from '../api/auth';
import { validatePassword } from '../lib/validation';
import { validateDate } from '../lib/dates';
vi.mock('../api/auth', () => ({ login: vi.fn(), register: vi.fn(), getCurrentUser: vi.fn().mockResolvedValue({ email: 'user@example.com' }) }));
beforeEach(() => { vi.mocked(auth.login).mockReset(); vi.mocked(auth.register).mockReset(); });
it('guards oversized titles and invalid calendar dates before submission', async () => {
  const create = vi.fn(); render(<TaskForm onCreate={create} onError={vi.fn()} />);
  fireEvent.change(screen.getByPlaceholderText('Nueva tarea...'), { target: { value: 'a'.repeat(201) } });
  expect(screen.getByRole('button', { name: 'Agregar' })).toBeDisabled();
  expect(screen.getByText('El título no puede superar 200 caracteres.')).toHaveClass('invalid-feedback');
  expect(create).not.toHaveBeenCalled();
  for (const date of ['0000-01-01', '2025-02-29', '2026-04-31', '10000-01-01']) expect(validateDate(date)).not.toBe('');
  for (const date of ['', '0001-01-01', '2024-02-29', '9999-12-31']) expect(validateDate(date)).toBe('');
});
it('preserves accessible login/register transitions and registration validation', async () => {
  const user = userEvent.setup(); renderWithAuth(<LoginForm />);
  expect(screen.getByRole('heading', { name: 'Iniciar Sesión' })).toHaveClass('auth-title');
  expect(screen.queryByRole('button', { name: 'Registrarse y Entrar' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '¿No tienes cuenta? Regístrate' }));
  expect(screen.getByRole('heading', { name: 'Registro' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument();
  await user.type(screen.getByLabelText('Contraseña'), 'abc');
  expect(screen.getByRole('button', { name: 'Registrarse y Entrar' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: '¿Ya tienes cuenta? Inicia sesión' }));
  expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
});
it('validates empty titles, max length and dates next to the field', async () => {
  const create = vi.fn(); const user = userEvent.setup();
  render(<TaskForm onCreate={create} onError={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Agregar' })).toBeDisabled();
  expect(screen.getByPlaceholderText('Nueva tarea...')).toHaveAttribute('maxlength', '200');
  await user.type(screen.getByPlaceholderText('Nueva tarea...'), 'Tarea');
  fireEvent.change(screen.getByLabelText('Fecha de inicio'), { target: { value: '2026-11-20' } });
  fireEvent.change(screen.getByLabelText('Fecha de término'), { target: { value: '2026-11-19' } });
  expect(screen.getByText(/no puede ser anterior/)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Agregar' })).toBeDisabled();
  expect(create).not.toHaveBeenCalled();
});
it('validates password UTF-8 bytes, length, letter and digit', () => {
  expect(validatePassword('abc1')).not.toBe('');
  expect(validatePassword('abcdefgh')).not.toBe('');
  expect(validatePassword('12345678')).not.toBe('');
  expect(validatePassword('á'.repeat(36) + '1')).toContain('72 bytes');
  expect(validatePassword('á'.repeat(35) + 'a1')).toBe('');
});
it('shows timeout and re-enables login without submitting twice', async () => {
  let reject!: (error: unknown) => void;
  vi.mocked(auth.login).mockReturnValue(new Promise((_, fail) => { reject = fail; }));
  const user = userEvent.setup(); renderWithAuth(<LoginForm />);
  await user.type(screen.getByLabelText('Email'), 'andre@example.com');
  await user.type(screen.getByLabelText('Contraseña'), 'Password1');
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(screen.getByRole('button', { name: 'Entrando…' })).toBeDisabled();
  reject({ kind: 'timeout' });
  expect(await screen.findByText(/tardó demasiado/)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  expect(auth.login).toHaveBeenCalledTimes(1);
});
it('renders backend fields and handles Retry-After', async () => {
  vi.mocked(auth.login).mockRejectedValueOnce({ status: 422, errors: [{ field: 'email', message: 'Email no válido' }] })
    .mockRejectedValueOnce({ status: 429, retryAfter: '1' });
  const user = userEvent.setup(); renderWithAuth(<LoginForm />);
  await user.type(screen.getByLabelText('Email'), 'andre@example.com');
  await user.type(screen.getByLabelText('Contraseña'), 'Password1');
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(screen.getByLabelText('Email')).toHaveClass('is-invalid');
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(screen.getByRole('button', { name: 'Espera 1 s' })).toBeDisabled();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled(), { timeout: 2000 });
});
