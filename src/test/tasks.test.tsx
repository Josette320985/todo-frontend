import { expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskList from '../components/TaskList';
import * as api from '../api/tasks';
import type { Task } from '../types/task';
vi.mock('../api/tasks', () => ({ listTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), removeTask: vi.fn() }));
let rows: Task[];
beforeEach(() => {
  rows = [];
  vi.mocked(api.listTasks).mockImplementation(async () => [...rows]);
  vi.mocked(api.createTask).mockImplementation(async data => {
    const task = { id: 1, title: data.title, description: null, completed: false, start_date: data.start_date ?? null, end_date: data.end_date ?? null };
    rows = [task]; return task;
  });
  vi.mocked(api.updateTask).mockImplementation(async (id, data) => {
    rows = rows.map(task => task.id === id ? { ...task, ...data } as Task : task); return rows[0];
  });
  vi.mocked(api.removeTask).mockImplementation(async id => { rows = rows.filter(task => task.id !== id); });
});
it('preserves create, toggle, edit, cancel and delete', async () => {
  const user = userEvent.setup(); render(<TaskList />);
  await screen.findByText('No hay tareas pendientes.');
  await user.type(screen.getByPlaceholderText('Nueva tarea...'), 'Primera');
  await user.click(screen.getByRole('button', { name: 'Agregar' }));
  await screen.findByText('Primera');
  await user.click(screen.getByRole('checkbox'));
  await waitFor(() => expect(screen.getByRole('checkbox')).toBeChecked());
  await user.click(screen.getByRole('button', { name: 'Modificar' }));
  let row = screen.getByRole('button', { name: 'Guardar' }).closest('.list-group-item')!;
  await user.clear(within(row as HTMLElement).getByRole('textbox'));
  await user.type(within(row as HTMLElement).getByRole('textbox'), 'Descartada');
  await user.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.getByText('Primera')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Modificar' }));
  row = screen.getByRole('button', { name: 'Guardar' }).closest('.list-group-item')!;
  await user.clear(within(row as HTMLElement).getByRole('textbox'));
  await user.type(within(row as HTMLElement).getByRole('textbox'), 'Editada');
  await user.click(screen.getByRole('button', { name: 'Guardar' }));
  await screen.findByText('Editada');
  await user.click(screen.getByRole('button', { name: 'Eliminar' }));
  await screen.findByText('No hay tareas pendientes.');
});
