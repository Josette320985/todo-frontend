// ARQ-08: the session lives in AuthProvider and is read through useAuth().
import { expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import AuthProvider from '../components/AuthProvider';
import { useAuth } from '../hooks/useAuth';
import { AUTH_UNAUTHORIZED_EVENT } from '../api/client';
import * as auth from '../api/auth';

vi.mock('../api/auth', () => ({ login: vi.fn(), register: vi.fn(), logout: vi.fn(), getCurrentUser: vi.fn() }));
vi.mock('../api/tasks', () => ({ listTasks: vi.fn().mockResolvedValue([]) }));

beforeEach(() => {
  vi.mocked(auth.getCurrentUser).mockReset().mockResolvedValue({ id: 1, email: 'jj@example.com' } as never);
  vi.mocked(auth.logout).mockReset().mockImplementation(async () => { localStorage.removeItem('token'); });
});

function Probe() {
  const { isLoggedIn, sessionExpired } = useAuth();
  return <p>{`logged:${isLoggedIn} expired:${sessionExpired}`}</p>;
}

it('throws a clear error when useAuth is used outside the provider', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => render(<Probe />)).toThrow('useAuth must be used inside <AuthProvider>');
  vi.mocked(console.error).mockRestore();
});

it('starts logged in when a token is stored and shows the user email', async () => {
  localStorage.setItem('token', 'abc');
  render(<AuthProvider><App /></AuthProvider>);
  expect(await screen.findByText('jj@example.com')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cerrar Sesión' })).toBeInTheDocument();
});

it('ends the session and flags it as expired on a 401 event', async () => {
  localStorage.setItem('token', 'abc');
  render(<AuthProvider><Probe /></AuthProvider>);
  expect(screen.getByText('logged:true expired:false')).toBeInTheDocument();
  act(() => { window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT)); });
  expect(screen.getByText('logged:false expired:true')).toBeInTheDocument();
});

it('logs out from the navbar even if the server call fails', async () => {
  localStorage.setItem('token', 'abc');
  vi.mocked(auth.logout).mockRejectedValueOnce(new Error('offline'));
  const user = userEvent.setup();
  render(<AuthProvider><App /></AuthProvider>);
  await user.click(screen.getByRole('button', { name: 'Cerrar Sesión' }));
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument());
  expect(auth.logout).toHaveBeenCalledTimes(1);
});
