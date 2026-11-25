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
  vi.mocked(auth.login).mockReset();
  vi.mocked(auth.register).mockReset();
  vi.mocked(auth.getCurrentUser).mockReset().mockResolvedValue({ id: 1, email: 'jj@example.com' } as never);
  vi.mocked(auth.logout).mockReset().mockImplementation(async () => { localStorage.removeItem('token'); });
  vi.mocked(auth.getCurrentUser).mockReset().mockResolvedValue({ id: '00000000-0000-4000-8000-000000000001', email: 'jj@example.com' } as never);
  vi.mocked(auth.logout).mockReset().mockResolvedValue();
});

function Probe() {
  const { isLoggedIn, sessionExpired } = useAuth();
  return <p>{`logged:${isLoggedIn} expired:${sessionExpired}`}</p>;
}

it('throws a clear error when useAuth is used outside the provider', () => {
  vi.spyOn(console, 'error').mockImplementation(() => { });
  expect(() => render(<Probe />)).toThrow('useAuth must be used inside <AuthProvider>');
  vi.mocked(console.error).mockRestore();
});

it('starts logged in when a token is stored and shows the user email', async () => {
  localStorage.setItem('token', 'abc');
  it('starts logged in when /auth/me succeeds and shows the user email', async () => {
    render(<AuthProvider><App /></AuthProvider>);
    expect(await screen.findByText('jj@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar Sesión' })).toBeInTheDocument();
  });

  it('ends the session and flags it as expired on a 401 event', async () => {
    localStorage.setItem('token', 'abc');
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByText('logged:true expired:false')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('logged:true expired:false')).toBeInTheDocument());
    act(() => { window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT)); });
    expect(screen.getByText('logged:false expired:true')).toBeInTheDocument();
  });

  it('logs out from the navbar even if the server call fails', async () => {
    localStorage.setItem('token', 'abc');
    vi.mocked(auth.logout).mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup();
    render(<AuthProvider><App /></AuthProvider>);
    await user.click(screen.getByRole('button', { name: 'Cerrar Sesión' }));
    await user.click(await screen.findByRole('button', { name: 'Cerrar Sesión' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument());
    expect(auth.logout).toHaveBeenCalledTimes(1);
  });

  // UX-06: an invalid stored token explains why the user is back at the login.
  it('tells the user the session expired when the stored token is rejected', async () => {
    localStorage.setItem('token', 'expired');
    vi.mocked(auth.getCurrentUser).mockImplementationOnce(async () => {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
      throw new Error('401');
    });
    // UX-06: an expired session explains why the user is back at the login.
    it('tells the user the session expired when a protected request returns 401', async () => {
      render(<AuthProvider><App /></AuthProvider>);
      await screen.findByText('jj@example.com');
      act(() => { window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT)); });
      expect(await screen.findByRole('alert')).toHaveTextContent('Tu sesión expiró. Vuelve a iniciar sesión.');
      expect(screen.getByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    });

    it('does not show the expired notice after a normal logout', async () => {
      localStorage.setItem('token', 'abc');
      const user = userEvent.setup();
      render(<AuthProvider><App /></AuthProvider>);
      await user.click(screen.getByRole('button', { name: 'Cerrar Sesión' }));
      await user.click(await screen.findByRole('button', { name: 'Cerrar Sesión' }));
      await screen.findByRole('heading', { name: 'Iniciar Sesión' });
      expect(screen.queryByText(/Tu sesión expiró/)).not.toBeInTheDocument();
    });

    it('muestra el skeleton en cuanto se pulsa Entrar, sin esperar al login', async () => {
      vi.mocked(auth.getCurrentUser).mockRejectedValueOnce(new Error('401'));
      let finish!: () => void;
      vi.mocked(auth.login).mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
      const user = userEvent.setup();
      render(<AuthProvider><App /></AuthProvider>);
      await user.type(screen.getByLabelText('Email'), 'andre@example.com');
      await user.type(await screen.findByLabelText('Email'), 'andre@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'Password1');
      await user.click(screen.getByRole('button', { name: 'Entrar' }));

      expect(screen.getByRole('status', { name: 'Cargando la aplicación' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Iniciar Sesión' })).not.toBeInTheDocument();
      expect(auth.login).toHaveBeenCalledTimes(1);

      await act(async () => { finish(); });
      await waitFor(() => expect(screen.queryByRole('status', { name: 'Cargando la aplicación' })).not.toBeInTheDocument());
      expect(await screen.findByRole('button', { name: 'Cerrar Sesión' })).toBeInTheDocument();
    });

    it('vuelve al login con el error si falla el login optimista', async () => {
      vi.mocked(auth.getCurrentUser).mockRejectedValueOnce(new Error('401'));
      vi.mocked(auth.login).mockRejectedValueOnce({ kind: 'timeout' });
      const user = userEvent.setup();
      render(<AuthProvider><App /></AuthProvider>);
      await user.type(screen.getByLabelText('Email'), 'andre@example.com');
      await user.type(await screen.findByLabelText('Email'), 'andre@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'Password1');
      await user.click(screen.getByRole('button', { name: 'Entrar' }));

      expect(await screen.findByText(/tardó demasiado/)).toBeVisible();
      expect(screen.queryByRole('status', { name: 'Cargando la aplicación' })).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    });

    it('muestra el skeleton en cuanto se pulsa Cerrar Sesión', async () => {
      localStorage.setItem('token', 'abc');
      let finish!: () => void;
      vi.mocked(auth.logout).mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
      const user = userEvent.setup();
      render(<AuthProvider><App /></AuthProvider>);
      await screen.findByText('jj@example.com');
      await user.click(screen.getByRole('button', { name: 'Cerrar Sesión' }));

      expect(screen.getByRole('status', { name: 'Cargando la aplicación' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Cerrar Sesión' })).not.toBeInTheDocument();
      expect(auth.logout).toHaveBeenCalledTimes(1);

      await act(async () => { finish(); });
      expect(await screen.findByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    });
