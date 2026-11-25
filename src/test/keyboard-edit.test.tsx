import { expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskList from '../components/TaskList';
import * as api from '../api/tasks';
import type { Task } from '../types/task';

// UX-08: inline editing usable with the keyboard alone.
vi.mock('../api/tasks', () => ({ listTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), removeTask: vi.fn() }));

let rows: Task[];
const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const task = (id: number, title: string): Task =>
  ({ id, title, description: null, completed: false, start_date: null, end_date: null });
({ id: uid(id), title, description: null, completed: false, start_date: null, end_date: null });

beforeEach(() => {
  rows = [task(1, 'Comprar pan'), task(2, 'Pagar luz')];
  vi.mocked(api.listTasks).mockImplementation(async () => [...rows]);
  vi.mocked(api.updateTask).mockImplementation(async (id, data) => {
    rows = rows.map(row => row.id === id ? { ...row, ...data } as Task : row);
    return rows.find(row => row.id === id)!;
  });
});

const titleInput = () => screen.getByRole('textbox', { name: 'Título de la tarea' });

it('focuses the title as soon as editing starts', async () => {
  const user = userEvent.setup();
  render(<TaskList />);
  await user.click(await screen.findByRole('button', { name: 'Modificar: Comprar pan' }));

  expect(titleInput()).toHaveFocus();
});

it('Enter saves and focus returns to the edit button of that row', async () => {
  const user = userEvent.setup();
  render(<TaskList />);
  await user.click(await screen.findByRole('button', { name: 'Modificar: Comprar pan' }));

  await user.clear(titleInput());
  await user.type(titleInput(), 'Comprar tortillas{Enter}');

  await waitFor(() => expect(api.updateTask).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'Comprar tortillas' })));
  await waitFor(() => expect(api.updateTask).toHaveBeenCalledWith(uid(1), expect.objectContaining({ title: 'Comprar tortillas' })));
  const edit = await screen.findByRole('button', { name: 'Modificar: Comprar tortillas' });
  await waitFor(() => expect(edit).toHaveFocus());
});

it('Escape cancels without saving and returns focus to the edit button', async () => {
  const user = userEvent.setup();
  render(<TaskList />);
  await user.click(await screen.findByRole('button', { name: 'Modificar: Pagar luz' }));

  await user.type(titleInput(), ' (cambio descartado)');
  await user.keyboard('{Escape}');

  expect(screen.queryByRole('textbox', { name: 'Título de la tarea' })).not.toBeInTheDocument();
  expect(api.updateTask).not.toHaveBeenCalled();
  expect(screen.getByText('Pagar luz')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Modificar: Pagar luz' })).toHaveFocus();
});

it('the whole flow works with the keyboard only', async () => {
  const user = userEvent.setup();
  render(<TaskList />);
  const edit = await screen.findByRole('button', { name: 'Modificar: Comprar pan' });
  edit.focus();

  await user.keyboard('{Enter}');
  expect(titleInput()).toHaveFocus();
  await user.keyboard('{Escape}');

  expect(screen.getByRole('button', { name: 'Modificar: Comprar pan' })).toHaveFocus();
});

it('opening another row does not move focus back to the previous one', async () => {
  const user = userEvent.setup();
  render(<TaskList />);
  await user.click(await screen.findByRole('button', { name: 'Modificar: Comprar pan' }));
  await user.click(screen.getByRole('button', { name: 'Modificar: Pagar luz' }));

  expect(titleInput()).toHaveFocus();
  expect(titleInput()).toHaveValue('Pagar luz');
});
