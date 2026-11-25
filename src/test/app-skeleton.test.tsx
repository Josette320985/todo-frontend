import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import AuthProvider from '../components/AuthProvider';
import * as auth from '../api/auth';
import type { UserRead } from '../types/auth';

vi.mock('../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock('../components/TaskList', () => ({ default: () => 'Lista de tareas' }));

const originalReadyState = document.readyState;

function setReadyState(value: DocumentReadyState): void {
  Object.defineProperty(document, 'readyState', { configurable: true, value });
}

function addBootShell(): void {
  const shell = document.createElement('div');
  shell.id = 'boot-skeleton';
  document.body.append(shell);
}

describe('skeleton global', () => {
  beforeEach(() => {
    vi.mocked(auth.getCurrentUser).mockReset();
    vi.mocked(auth.getCurrentUser).mockResolvedValue({ id: 1, email: 'jj@example.com' });
    vi.mocked(auth.getCurrentUser).mockResolvedValue({ id: '00000000-0000-4000-8000-000000000001', email: 'jj@example.com' });
  });

  afterEach(() => {
    setReadyState(originalReadyState);
    document.getElementById('boot-skeleton')?.remove();
  });

  it('muestra skeletons hasta que la página termina de cargar', () => {
    it('muestra skeletons hasta que la página termina de cargar', async () => {
      vi.mocked(auth.getCurrentUser).mockRejectedValueOnce(new Error('401'));
      setReadyState('loading');
      addBootShell();
      render(<AuthProvider><App /></AuthProvider>);
      expect(document.getElementById('boot-skeleton')).not.toHaveAttribute('hidden');
      expect(screen.getByRole('status', { name: 'Cargando la aplicación' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Iniciar Sesión' })).not.toBeInTheDocument();

      act(() => {
        await act(async () => {
          setReadyState('complete');
          window.dispatchEvent(new Event('load'));
        });

        expect(screen.getByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();
        expect(await screen.findByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();
        expect(screen.queryByRole('status', { name: 'Cargando la aplicación' })).not.toBeInTheDocument();
        expect(document.getElementById('boot-skeleton')).toHaveAttribute('hidden');
      });

      it('muestra un placeholder del email mientras /auth/me responde', async () => {
        localStorage.setItem('token', 'test-token');
        addBootShell();
        let resolveProfile!: (value: UserRead) => void;
        vi.mocked(auth.getCurrentUser).mockImplementation(() => new Promise<UserRead>(resolve => { resolveProfile = resolve; }));

        render(<AuthProvider><App /></AuthProvider>);
        expect(document.getElementById('boot-skeleton')).toHaveAttribute('hidden');
        const nav = screen.getByRole('navigation');
        expect(nav.querySelectorAll('.placeholder')).toHaveLength(1);
        expect(screen.getByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();

        await act(async () => { resolveProfile({ id: 1, email: 'jj@example.com' }); });
        await act(async () => { resolveProfile({ id: '00000000-0000-4000-8000-000000000001', email: 'jj@example.com' }); });

        expect(await screen.findByText('jj@example.com')).toBeInTheDocument();
        expect(nav.querySelectorAll('.placeholder')).toHaveLength(0);
      });
    });
