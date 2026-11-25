import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskList from '../components/TaskList';
import * as api from '../api/tasks';
import type { Task } from '../types/task';

vi.mock('../api/tasks', () => ({ listTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), removeTask: vi.fn() }));

const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
let rows: Task[];

beforeEach(() => {
  vi.clearAllMocks();
  rows = [];
  vi.mocked(api.listTasks).mockImplementation(async () => [...rows]);
  vi.mocked(api.updateTask).mockImplementation(async (id, data) => {
    const saved = { ...rows.find(item => item.id === id)!, ...data } as Task;
    rows = rows.map(item => item.id === id ? saved : item);
    return saved;
  });
});

it('shows celebratory row feedback and toast when completing a task', async () => {
  rows = [
    { id: 1, title: 'Enviar reporte', description: null, completed: false, start_date: null, end_date: null },
    { id: 2, title: 'Revisar PR', description: null, completed: false, start_date: null, end_date: null },
    { id: uid(1), title: 'Enviar reporte', description: null, completed: false, start_date: null, end_date: null },
    { id: uid(2), title: 'Revisar PR', description: null, completed: false, start_date: null, end_date: null },
  ];
  const user = userEvent.setup();
  render(<TaskList />);

  const checkbox = await screen.findByRole('checkbox', { name: 'Enviar reporte' });
  await user.click(checkbox);

  await waitFor(() => expect(screen.getByText('¡Completada!')).toBeInTheDocument());
  const row = screen.getByRole('checkbox', { name: 'Enviar reporte' }).closest('.list-group-item');
  expect(row).toHaveClass('task-row-completed', 'task-row-celebrate');
  const toast = screen.getByRole('status', { name: 'Tarea completada' });
  expect(toast).toHaveTextContent('¡Tarea completada!');
  expect(toast).toHaveTextContent('Completaste: Enviar reporte');
  expect(screen.queryByText('¡Todo al día!')).not.toBeInTheDocument();
});

it('adds "¡Todo al día!" badge when the last pending task is completed', async () => {
  rows = [{ id: 1, title: 'Última tarea', description: null, completed: false, start_date: null, end_date: null }];
  rows = [{ id: uid(1), title: 'Última tarea', description: null, completed: false, start_date: null, end_date: null }];
  const user = userEvent.setup();
  render(<TaskList />);

  await user.click(await screen.findByRole('checkbox', { name: 'Última tarea' }));

  const toast = await screen.findByRole('status', { name: 'Tarea completada' });
  expect(toast).toHaveTextContent('¡Todo al día!');
});

it('does not show celebratory feedback when completing fails and rolls back', async () => {
  rows = [{ id: 1, title: 'Fallida', description: null, completed: false, start_date: null, end_date: null }];
  rows = [{ id: uid(1), title: 'Fallida', description: null, completed: false, start_date: null, end_date: null }];
  vi.mocked(api.updateTask).mockRejectedValueOnce({ status: 500 });
  const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
  try {
    const user = userEvent.setup();
    render(<TaskList />);
    await user.click(await screen.findByRole('checkbox', { name: 'Fallida' }));

    await screen.findByText('Algo falló en el servidor. Intenta de nuevo en un momento.');
    expect(screen.queryByText('¡Completada!')).not.toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Tarea completada' })).not.toBeInTheDocument();
  } finally {
    spy.mockRestore();
  }
});

it('clears completed feedback when a task is marked pending again', async () => {
  rows = [{ id: 1, title: 'Reabrir', description: null, completed: false, start_date: null, end_date: null }];
  rows = [{ id: uid(1), title: 'Reabrir', description: null, completed: false, start_date: null, end_date: null }];
  const user = userEvent.setup();
  render(<TaskList />);

  await user.click(await screen.findByRole('checkbox', { name: 'Reabrir' }));
  await screen.findByText('¡Completada!');

  await user.click(screen.getByRole('checkbox', { name: 'Reabrir' }));
  await waitFor(() => expect(screen.queryByText('¡Completada!')).not.toBeInTheDocument());
  const row = screen.getByRole('checkbox', { name: 'Reabrir' }).closest('.list-group-item');
  expect(row).not.toHaveClass('task-row-completed');
});
