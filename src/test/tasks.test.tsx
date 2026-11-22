import { expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskList from '../components/TaskList';
import * as api from '../api/tasks';
import type { Task } from '../types/task';
vi.mock('../api/tasks', () => ({ listTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), removeTask: vi.fn() }));
let rows: Task[];
beforeEach(() => {
  vi.clearAllMocks();
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
  await screen.findByText('Aún no tienes tareas. Escribe la primera arriba.');
  await user.type(screen.getByPlaceholderText('Nueva tarea...'), 'Primera');
  await user.click(screen.getByRole('button', { name: 'Agregar' }));
  await screen.findByText('Primera');
  await user.click(screen.getByRole('checkbox'));
  await waitFor(() => expect(screen.getByRole('checkbox')).toBeChecked());
  await user.click(screen.getByRole('button', { name: 'Modificar: Primera' }));
  let row = screen.getByRole('button', { name: 'Guardar' }).closest('.list-group-item')!;
  await user.clear(within(row as HTMLElement).getByRole('textbox', { name: 'Título de la tarea' }));
  await user.type(within(row as HTMLElement).getByRole('textbox', { name: 'Título de la tarea' }), 'Descartada');
  await user.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.getByText('Primera')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Modificar: Primera' }));
  row = screen.getByRole('button', { name: 'Guardar' }).closest('.list-group-item')!;
  await user.clear(within(row as HTMLElement).getByRole('textbox', { name: 'Título de la tarea' }));
  await user.type(within(row as HTMLElement).getByRole('textbox', { name: 'Título de la tarea' }), 'Editada');
  await user.click(screen.getByRole('button', { name: 'Guardar' }));
  await screen.findByText('Editada');
  await user.click(screen.getByRole('button', { name: 'Eliminar: Editada' }));
  await screen.findByText('Aún no tienes tareas. Escribe la primera arriba.');
});
it('removes a stale task after a 404 from delete', async () => {
  rows = [{ id: 1, title: 'Eliminada en otra pestaña', completed: false, description: null, start_date: null, end_date: null }];
  vi.mocked(api.removeTask).mockRejectedValueOnce({ status: 404 });
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const user = userEvent.setup(); render(<TaskList />);
    await screen.findByText('Eliminada en otra pestaña');
    await user.click(screen.getByRole('button', { name: 'Eliminar: Eliminada en otra pestaña' }));
    await screen.findByText('Esta tarea ya no existe');
    expect(screen.queryByText('Eliminada en otra pestaña')).not.toBeInTheDocument();
  } finally { spy.mockRestore(); }
});
it('shows network failures on create and keeps the draft for retry', async () => {
  vi.mocked(api.createTask).mockRejectedValueOnce({ kind: 'network' });
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const user = userEvent.setup(); render(<TaskList />);
    await screen.findByText('Aún no tienes tareas. Escribe la primera arriba.');
    await user.type(screen.getByPlaceholderText('Nueva tarea...'), 'Pendiente');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    await screen.findByText('No hay conexión con el servidor. Revisa tu internet.');
    expect(screen.getByPlaceholderText('Nueva tarea...')).toHaveValue('Pendiente');
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeEnabled();
  } finally { spy.mockRestore(); }
});

it('uses mutation responses without reloading the whole list', async () => {
  const user = userEvent.setup(); render(<TaskList />);
  await screen.findByText('Aún no tienes tareas. Escribe la primera arriba.');
  expect(api.listTasks).toHaveBeenCalledTimes(1);

  await user.type(screen.getByPlaceholderText('Nueva tarea...'), 'Primera');
  await user.click(screen.getByRole('button', { name: 'Agregar' }));
  await screen.findByText('Primera');
  await user.click(screen.getByRole('checkbox'));
  await waitFor(() => expect(screen.getByRole('checkbox')).toBeChecked());

  await user.click(screen.getByRole('button', { name: 'Modificar: Primera' }));
  const row = screen.getByRole('button', { name: 'Guardar' }).closest('.list-group-item') as HTMLElement;
  await user.clear(within(row).getByRole('textbox', { name: 'Título de la tarea' }));
  await user.type(within(row).getByRole('textbox', { name: 'Título de la tarea' }), 'Editada');
  await user.click(screen.getByRole('button', { name: 'Guardar' }));
  await screen.findByText('Editada');

  await user.click(screen.getByRole('button', { name: 'Eliminar: Editada' }));
  await screen.findByText('Aún no tienes tareas. Escribe la primera arriba.');
  expect(api.listTasks).toHaveBeenCalledTimes(1);
});

it('toggles instantly and rolls back when PUT fails', async () => {
  rows = [{ id: 1, title: 'Inmediata', completed: false, description: null, start_date: null, end_date: null }];
  let rejectToggle!: (reason?: unknown) => void;
  vi.mocked(api.updateTask).mockImplementationOnce(() => new Promise<Task>((_resolve, reject) => { rejectToggle = reject; }));
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const user = userEvent.setup(); render(<TaskList />);
    const checkbox = await screen.findByRole('checkbox');
    await user.click(checkbox);
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(api.listTasks).toHaveBeenCalledTimes(1);

    rejectToggle({ status: 500 });
    await screen.findByText('Algo falló en el servidor. Intenta de nuevo en un momento.');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(api.listTasks).toHaveBeenCalledTimes(1);
  } finally { spy.mockRestore(); }
});

it('restores the original task when editing fails', async () => {
  rows = [{ id: 1, title: 'Original', completed: false, description: null, start_date: null, end_date: null }];
  let rejectEdit!: (reason?: unknown) => void;
  vi.mocked(api.updateTask).mockImplementationOnce(() => new Promise<Task>((_resolve, reject) => { rejectEdit = reject; }));
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const user = userEvent.setup(); render(<TaskList />);
    await screen.findByText('Original');
    await user.click(screen.getByRole('button', { name: 'Modificar: Original' }));
    const row = screen.getByRole('button', { name: 'Guardar' }).closest('.list-group-item') as HTMLElement;
    const field = within(row).getByRole('textbox', { name: 'Título de la tarea' });
    await user.clear(field);
    await user.type(field, 'Cambio');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(field).toHaveValue('Cambio');

    rejectEdit({ status: 500 });
    await screen.findByText('Algo falló en el servidor. Intenta de nuevo en un momento.');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByText('Original')).toBeInTheDocument();
  } finally { spy.mockRestore(); }
});

it('restores a row when DELETE fails', async () => {
  rows = [
    { id: 1, title: 'Primera', completed: false, description: null, start_date: null, end_date: null },
    { id: 2, title: 'Segunda', completed: false, description: null, start_date: null, end_date: null },
  ];
  let rejectDelete!: (reason?: unknown) => void;
  vi.mocked(api.removeTask).mockImplementationOnce(() => new Promise<void>((_resolve, reject) => { rejectDelete = reject; }));
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const user = userEvent.setup(); render(<TaskList />);
    await screen.findByText('Segunda');
    await user.click(screen.getByRole('button', { name: 'Eliminar: Primera' }));
    expect(screen.queryByText('Primera')).not.toBeInTheDocument();
    expect(api.listTasks).toHaveBeenCalledTimes(1);

    rejectDelete({ status: 500 });
    await screen.findByText('Algo falló en el servidor. Intenta de nuevo en un momento.');
    expect(screen.getByText('Primera')).toBeInTheDocument();
    expect(api.listTasks).toHaveBeenCalledTimes(1);
  } finally { spy.mockRestore(); }
});
