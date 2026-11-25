// TEST-08: component interactions that are already implemented.
import { expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ListGroup } from 'react-bootstrap';
import userEvent from '@testing-library/user-event';
import LoginForm from '../components/LoginForm';
import TaskItem from '../components/TaskItem';
import type { Task } from '../types/task';
import { renderWithAuth } from './renderWithAuth';
import * as auth from '../api/auth';

vi.mock('../api/auth', () => ({ login: vi.fn(), register: vi.fn(), validateRegistrationEmail: vi.fn(async (email: string) => ({ valid: true, normalized: email })), getCurrentUser: vi.fn().mockResolvedValue({ email: 'user@example.com' }) }));

beforeEach(() => { vi.mocked(auth.login).mockReset(); vi.mocked(auth.register).mockReset(); });

it('sends a single login request on a double click (UX-02)', async () => {
  let finish!: () => void;
  vi.mocked(auth.login).mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
  const user = userEvent.setup();
  renderWithAuth(<LoginForm />);
  await user.type(screen.getByLabelText('Email'), 'user@example.com');
  await user.type(screen.getByLabelText('Contraseña'), 'Password1');

  await user.dblClick(screen.getByRole('button', { name: 'Entrar' }));

  expect(auth.login).toHaveBeenCalledTimes(1);
  finish();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled());
  expect(auth.login).toHaveBeenCalledTimes(1);
});

it('toggles a task when its text is clicked (UX-09)', async () => {
  const task: Task = { id: 7, title: 'Pagar luz', description: null, completed: false, start_date: null, end_date: null };
  const task: Task = { id: '00000000-0000-4000-8000-000000000007', title: 'Pagar luz', description: null, completed: false, start_date: null, end_date: null };
  const onToggle = vi.fn().mockResolvedValue(true);
  const user = userEvent.setup();
  render(<ListGroup><TaskItem task={task} editing={false} onEdit={vi.fn()} onToggle={onToggle}
    onDelete={vi.fn()} onUpdate={vi.fn()} onError={vi.fn()} /></ListGroup>);

  expect(screen.getByRole('checkbox', { name: 'Pagar luz' })).toHaveAttribute('id', 'task-7');
  expect(screen.getByRole('checkbox', { name: 'Pagar luz' })).toHaveAttribute('id', 'task-00000000-0000-4000-8000-000000000007');
  await user.click(screen.getByText('Pagar luz'));

  expect(onToggle).toHaveBeenCalledWith(task);
});

it('labels every login field and asks the browser for the right autofill (UX-09)', async () => {
  const user = userEvent.setup();
  renderWithAuth(<LoginForm />);
  expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email');
  expect(screen.getByLabelText('Contraseña')).toHaveAttribute('autocomplete', 'current-password');
  await user.click(screen.getByRole('button', { name: '¿No tienes cuenta? Regístrate' }));
  expect(screen.getByLabelText('Contraseña')).toHaveAttribute('autocomplete', 'new-password');
});

it('sends a single register request on a double click and shows its progress (UX-02)', async () => {
  let finish!: () => void;
  vi.mocked(auth.register).mockReturnValue(new Promise(resolve => { finish = () => resolve({ id: 1, email: 'new@example.com' } as never); }));
  vi.mocked(auth.register).mockReturnValue(new Promise(resolve => { finish = () => resolve({ id: '00000000-0000-4000-8000-000000000001', email: 'new@example.com' } as never); }));
  vi.mocked(auth.login).mockResolvedValue();
  const user = userEvent.setup();
  renderWithAuth(<LoginForm />);
  await user.click(screen.getByRole('button', { name: '¿No tienes cuenta? Regístrate' }));
  await user.type(screen.getByLabelText('Email'), 'new@example.com');
  await user.type(screen.getByLabelText('Contraseña'), 'Password1');

  await user.dblClick(screen.getByRole('button', { name: 'Registrarse y Entrar' }));

  expect(screen.getByRole('button', { name: 'Creando cuenta…' })).toBeDisabled();
  expect(screen.getByLabelText('Email')).toBeDisabled();
  expect(screen.getByLabelText('Contraseña')).toBeDisabled();
  expect(auth.register).toHaveBeenCalledTimes(1);
  finish();
  await waitFor(() => expect(auth.login).toHaveBeenCalledTimes(1));
});
