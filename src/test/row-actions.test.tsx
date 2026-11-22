import { expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskList from '../components/TaskList';
import * as api from '../api/tasks';
import type { Task } from '../types/task';

// UX-07: row actions are icon buttons with an accessible name and a tooltip.
vi.mock('../api/tasks', () => ({ listTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), removeTask: vi.fn() }));

const task = (id: number, title: string): Task =>
  ({ id, title, description: null, completed: false, start_date: null, end_date: null });

beforeEach(() => {
  vi.mocked(api.listTasks).mockResolvedValue([task(1, 'Comprar pan'), task(2, 'Pagar luz')]);
  vi.mocked(api.removeTask).mockResolvedValue();
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

it('the delete icon removes the right task', async () => {
  const user = userEvent.setup();
  render(<TaskList />);
  await user.click(await screen.findByRole('button', { name: 'Eliminar: Pagar luz' }));

  expect(api.removeTask).toHaveBeenCalledWith(2);
});
