// UX-01: loading, empty and error states of the task list.
import { expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskList from '../components/TaskList';
import * as api from '../api/tasks';
import type { Task } from '../types/task';

vi.mock('../api/tasks', () => ({ listTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), removeTask: vi.fn() }));

const EMPTY = 'Aún no tienes tareas. Escribe la primera arriba.';
const LOAD_ERROR = 'No pudimos cargar tus tareas';
const task: Task = { id: 1, title: 'Comprar pan', description: null, completed: false, start_date: null, end_date: null };

let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.mocked(api.listTasks).mockReset();
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => consoleError.mockRestore());

/** A listTasks call that stays pending until the test resolves it. */
function deferred() {
  let resolve!: (rows: Task[]) => void;
  vi.mocked(api.listTasks).mockImplementationOnce(() => new Promise<Task[]>(r => { resolve = r; }));
  return (rows: Task[]) => resolve(rows);
}

it('shows a skeleton while loading and never the empty state', async () => {
  const finish = deferred();
  render(<TaskList />);

  expect(screen.getByRole('status', { name: 'Cargando tareas' })).toBeInTheDocument();
  expect(screen.queryByText(EMPTY)).not.toBeInTheDocument();
  expect(screen.queryByText(LOAD_ERROR)).not.toBeInTheDocument();

  finish([]);
  expect(await screen.findByText(EMPTY)).toBeInTheDocument();
  expect(screen.queryByRole('status', { name: 'Cargando tareas' })).not.toBeInTheDocument();
});

it('shows the tasks once loaded', async () => {
  vi.mocked(api.listTasks).mockResolvedValueOnce([task]);
  render(<TaskList />);

  expect(await screen.findByText('Comprar pan')).toBeInTheDocument();
  expect(screen.queryByText(EMPTY)).not.toBeInTheDocument();
});

it('shows the load error with a retry that works (backend down, then up)', async () => {
  vi.mocked(api.listTasks).mockRejectedValueOnce({ kind: 'network' });
  const user = userEvent.setup();
  render(<TaskList />);

  expect(await screen.findByText(LOAD_ERROR)).toBeInTheDocument();
  expect(screen.queryByText(EMPTY)).not.toBeInTheDocument();

  const finish = deferred();
  await user.click(screen.getByRole('button', { name: 'Reintentar' }));
  // While retrying: skeleton again, no error and no empty state.
  expect(screen.getByRole('status', { name: 'Cargando tareas' })).toBeInTheDocument();
  expect(screen.queryByText(LOAD_ERROR)).not.toBeInTheDocument();

  finish([task]);
  expect(await screen.findByText('Comprar pan')).toBeInTheDocument();
  expect(api.listTasks).toHaveBeenCalledTimes(2);
});

it('keeps the load error out of the action alert and logs no details', async () => {
  vi.mocked(api.listTasks).mockRejectedValueOnce({ status: 500, message: 'Bearer SECRET' });
  render(<TaskList />);

  await screen.findByText(LOAD_ERROR);
  expect(screen.queryByText('Algo falló en el servidor. Intenta de nuevo en un momento.')).not.toBeInTheDocument();
  expect(JSON.stringify(consoleError.mock.calls)).not.toContain('SECRET');
});
