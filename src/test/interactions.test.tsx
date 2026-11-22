// TEST-08: component interactions that are already implemented.
import { expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../components/LoginForm';
import * as auth from '../api/auth';

vi.mock('../api/auth', () => ({ login: vi.fn(), register: vi.fn() }));

beforeEach(() => vi.mocked(auth.login).mockReset());

it('sends a single login request on a double click (UX-02)', async () => {
  let finish!: () => void;
  vi.mocked(auth.login).mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
  const onLogin = vi.fn();
  const user = userEvent.setup();
  render(<LoginForm onLogin={onLogin} />);
  await user.type(screen.getByLabelText('Email'), 'user@example.com');
  await user.type(screen.getByLabelText('Contraseña'), 'Password1');

  await user.dblClick(screen.getByRole('button', { name: 'Entrar' }));

  expect(auth.login).toHaveBeenCalledTimes(1);
  finish();
  await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));
});

// UX-09 is not implemented yet: Form.Check has no id, so the label is not
// linked to the checkbox and clicking the text does nothing. Turn this into a
// real test in the UX-09 PR.
it.todo('toggles a task when its text is clicked (UX-09)');
