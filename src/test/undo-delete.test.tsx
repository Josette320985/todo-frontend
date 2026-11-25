import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import TaskList from '../components/TaskList';
import * as api from '../api/tasks';
import type { Task } from '../types/task';

vi.mock('../api/tasks', () => ({ listTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), removeTask: vi.fn() }));

const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const task = (id: number, title: string): Task =>
  ({ id, title, description: null, completed: false, start_date: null, end_date: null });
({ id: uid(id), title, description: null, completed: false, start_date: null, end_date: null });

const rowIds = (): Array<string | null> =>
  screen.getAllByRole('checkbox').map(checkbox => checkbox.getAttribute('id'));

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.mocked(api.listTasks).mockReset().mockResolvedValue([task(1, 'Comprar pan'), task(2, 'Pagar luz'), task(3, 'Café')]);
  vi.mocked(api.createTask).mockReset();
  vi.mocked(api.updateTask).mockReset();
  vi.mocked(api.removeTask).mockReset().mockResolvedValue();
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
});

afterEach(() => {
  vi.useRealTimers();
  consoleError.mockRestore();
});

async function loadList() {
  render(<TaskList />);
  await screen.findByText('Pagar luz');
  vi.useFakeTimers();
}

async function clickDelete(title: string) {
  fireEvent.click(screen.getByRole('button', { name: `Eliminar: ${title}` }));
  await act(async () => { await Promise.resolve(); });
}

it('Deshacer restaura la tarea en su posición original y no llama al DELETE', async () => {
  await loadList();
  try {
    await clickDelete('Pagar luz');
    expect(rowIds()).toEqual(['task-1', 'task-3']);
    expect(rowIds()).toEqual([`task-${uid(1)}`, `task-${uid(3)}`]);

    fireEvent.click(screen.getByRole('button', { name: 'Deshacer eliminación de Pagar luz' }));
    expect(rowIds()).toEqual(['task-1', 'task-2', 'task-3']);
    expect(rowIds()).toEqual([`task-${uid(1)}`, `task-${uid(2)}`, `task-${uid(3)}`]);
    expect(screen.queryByText('Tarea eliminada ·')).not.toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(api.removeTask).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});

it('cada toast controla solo su tarea cuando hay varias eliminaciones pendientes', async () => {
  await loadList();
  try {
    await clickDelete('Pagar luz');
    await clickDelete('Café');
    expect(rowIds()).toEqual(['task-1']);
    expect(rowIds()).toEqual([`task-${uid(1)}`]);

    fireEvent.click(screen.getByRole('button', { name: 'Deshacer eliminación de Pagar luz' }));
    expect(rowIds()).toEqual(['task-1', 'task-2']);
    expect(rowIds()).toEqual([`task-${uid(1)}`, `task-${uid(2)}`]);

    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(api.removeTask).toHaveBeenCalledTimes(1);
    expect(api.removeTask).toHaveBeenCalledWith(3);
    expect(rowIds()).toEqual(['task-1', 'task-2']);
    expect(api.removeTask).toHaveBeenCalledWith(uid(3));
    expect(rowIds()).toEqual([`task-${uid(1)}`, `task-${uid(2)}`]);
  } finally {
    vi.useRealTimers();
  }
});

it('si el DELETE expirado falla, la tarea vuelve a aparecer', async () => {
  await loadList();
  try {
    vi.mocked(api.removeTask).mockRejectedValueOnce({ status: 500 });
    await clickDelete('Pagar luz');
    expect(rowIds()).toEqual(['task-1', 'task-3']);
    expect(rowIds()).toEqual([`task-${uid(1)}`, `task-${uid(3)}`]);

    await act(async () => { vi.advanceTimersByTime(5000); });

    expect(rowIds()).toEqual(['task-1', 'task-2', 'task-3']);
    expect(rowIds()).toEqual([`task-${uid(1)}`, `task-${uid(2)}`, `task-${uid(3)}`]);
    expect(screen.getByText('Pagar luz')).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});
