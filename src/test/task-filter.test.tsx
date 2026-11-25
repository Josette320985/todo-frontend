import { expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import TaskList from '../components/TaskList';
import * as api from '../api/tasks';
import { filterTasks } from '../lib/taskFilter';
import type { Task } from '../types/task';

// Segmented filter Todas / Pendientes / Completadas: local state, no backend.
vi.mock('../api/tasks', () => ({ listTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), removeTask: vi.fn() }));

const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const task = (id: number, title: string, completed = false): Task =>
  ({ id, title, description: null, completed, start_date: null, end_date: null });
({ id: uid(id), title, description: null, completed, start_date: null, end_date: null });

const rows = [task(1, 'Comprar pan'), task(2, 'Pagar luz'), task(3, 'Lavar auto', true)];

beforeEach(() => {
  vi.mocked(api.listTasks).mockReset().mockResolvedValue(rows);
  vi.mocked(api.createTask).mockReset();
  vi.mocked(api.updateTask).mockReset();
  vi.mocked(api.removeTask).mockReset().mockResolvedValue();
});

const select = (name: string) => fireEvent.click(screen.getByRole('radio', { name }));

it('shows the three options with "Todas" selected and every task', async () => {
  render(<TaskList />);
  await screen.findByText('Comprar pan');

  expect(screen.getByRole('group', { name: 'Filtrar tareas' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Todas' })).toBeChecked();
  expect(screen.getByRole('radio', { name: 'Pendientes' })).not.toBeChecked();
  expect(screen.getByRole('radio', { name: 'Completadas' })).not.toBeChecked();
  for (const title of ['Comprar pan', 'Pagar luz', 'Lavar auto']) expect(screen.getByText(title)).toBeInTheDocument();
});

it('"Pendientes" hides the completed tasks and keeps the backend order', async () => {
  render(<TaskList />);
  await screen.findByText('Comprar pan');

  select('Pendientes');

  expect(screen.getByRole('radio', { name: 'Pendientes' })).toBeChecked();
  expect(screen.getByText('Comprar pan')).toBeInTheDocument();
  expect(screen.getByText('Pagar luz')).toBeInTheDocument();
  expect(screen.queryByText('Lavar auto')).not.toBeInTheDocument();
});

it('"Completadas" shows only the completed tasks, and "Todas" brings them all back', async () => {
  render(<TaskList />);
  await screen.findByText('Comprar pan');

  select('Completadas');
  expect(screen.getByText('Lavar auto')).toBeInTheDocument();
  expect(screen.queryByText('Comprar pan')).not.toBeInTheDocument();

  select('Todas');
  for (const title of ['Comprar pan', 'Pagar luz', 'Lavar auto']) expect(screen.getByText(title)).toBeInTheDocument();
});

it('never goes back to the backend when the filter changes', async () => {
  render(<TaskList />);
  await screen.findByText('Comprar pan');

  select('Pendientes');
  select('Completadas');
  select('Todas');

  expect(api.listTasks).toHaveBeenCalledTimes(1);
});

it('explains when the filter matches nothing', async () => {
  vi.mocked(api.listTasks).mockResolvedValue([task(1, 'Comprar pan')]);
  render(<TaskList />);
  await screen.findByText('Comprar pan');

  select('Completadas');

  expect(screen.getByText('Aún no has completado ninguna tarea.')).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Completadas' })).toBeInTheDocument();
});

it('does not show the filter while there are no tasks', async () => {
  vi.mocked(api.listTasks).mockResolvedValue([]);
  render(<TaskList />);
  await screen.findByText('Aún no tienes tareas. Escribe la primera arriba.');

  expect(screen.queryByRole('radio', { name: 'Todas' })).not.toBeInTheDocument();
});

it('filterTasks only filters: the incoming order is kept', () => {
  const list = [task(3, 'c'), task(1, 'a', true), task(2, 'b')];

  expect(filterTasks(list, 'pending').map(item => item.id)).toEqual([3, 2]);
  expect(filterTasks(list, 'completed').map(item => item.id)).toEqual([1]);
  expect(filterTasks(list, 'all').map(item => item.id)).toEqual([3, 1, 2]);
  expect(filterTasks(list, 'pending').map(item => item.id)).toEqual([3, 2].map(uid));
  expect(filterTasks(list, 'completed').map(item => item.id)).toEqual([1].map(uid));
  expect(filterTasks(list, 'all').map(item => item.id)).toEqual([3, 1, 2].map(uid));
});