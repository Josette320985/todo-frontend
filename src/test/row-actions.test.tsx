import { expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import TaskList from '../components/TaskList';
import * as api from '../api/tasks';
import type { Task } from '../types/task';

// UX-07: row actions are icon buttons with an accessible name and a tooltip.
vi.mock('../api/tasks', () => ({ listTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), removeTask: vi.fn() }));

const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const task = (id: number, title: string): Task =>
  ({ id: uid(id), title, description: null, completed: false, start_date: null, end_date: null });

beforeEach(() => {
  vi.mocked(api.listTasks).mockReset().mockResolvedValue([task(1, 'Comprar pan'), task(2, 'Pagar luz')]);
  vi.mocked(api.createTask).mockReset();
  vi.mocked(api.updateTask).mockReset();
  vi.mocked(api.removeTask).mockReset().mockResolvedValue();
});

it('names each icon button after its task, so rows are distinguishable', async () => {
  render(<TaskList />);
  await screen.findByText('Comprar pan');

  for (const title of ['Comprar pan', 'Pagar luz']) {
    expect(screen.getByRole('button', { name: `Modificar: ${title}` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Eliminar: ${title}` })).toBeInTheDocument();
  }
});

it('shows icons instead of text, with a tooltip and a 40px touch target class', async () => {
  render(<TaskList />);
  const edit = await screen.findByRole('button', { name: 'Modificar: Comprar pan' });
  const remove = screen.getByRole('button', { name: 'Eliminar: Comprar pan' });

  for (const [button, tooltip] of [[edit, 'Modificar'], [remove, 'Eliminar']] as const) {
    expect(button).toHaveAttribute('title', tooltip);
    expect(button).toHaveClass('icon-button');
    expect(button.textContent).toBe('');
    const icon = button.querySelector('svg')!;
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  }
});

it('hides the row now and sends DELETE when the toast expires', async () => {
  render(<TaskList />);
  await screen.findByRole('button', { name: 'Eliminar: Pagar luz' });
  vi.useFakeTimers();
  try {
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar: Pagar luz' }));
    await act(async () => { await Promise.resolve(); });
    expect(screen.queryByText('Pagar luz')).not.toBeInTheDocument();
    expect(screen.getByText('Tarea eliminada ·')).toBeInTheDocument();
    expect(api.removeTask).not.toHaveBeenCalled();

    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(api.removeTask).toHaveBeenCalledWith(uid(2));
  } finally {
    vi.useRealTimers();
  }
});
