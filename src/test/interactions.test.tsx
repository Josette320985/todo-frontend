// TEST-08: component interactions that are already implemented.
import { expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../components/LoginForm';
import { renderWithAuth } from './renderWithAuth';
import * as auth from '../api/auth';

vi.mock('../api/auth', () => ({ login: vi.fn(), register: vi.fn(), getCurrentUser: vi.fn().mockResolvedValue({ email: 'user@example.com' }) }));

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

// UX-09 is not implemented yet: Form.Check has no id, so the label is not
// linked to the checkbox and clicking the text does nothing. Turn this into a
// real test in the UX-09 PR.
it.todo('toggles a task when its text is clicked (UX-09)');

it('sends a single register request on a double click and shows its progress (UX-02)', async () => {
  let finish!: () => void;
  vi.mocked(auth.register).mockReturnValue(new Promise(resolve => { finish = () => resolve({ id: 1, email: 'new@example.com' } as never); }));
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
