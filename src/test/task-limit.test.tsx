// SEG-H12 (frontend): warn about the per-user task cap.
import { expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskList from '../components/TaskList';
import * as api from '../api/tasks';
import { getApiError } from '../api/errors';
import { MAX_TASKS_PER_USER, TASK_LIMIT_MESSAGE } from '../lib/limits';
import type { Task } from '../types/task';

vi.mock('../api/tasks', () => ({ listTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), removeTask: vi.fn() }));

const tasks = (count: number): Task[] => Array.from({ length: count }, (_, i) =>
  ({ id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`, title: `Tarea ${i + 1}`, description: null, completed: false, start_date: null, end_date: null }));

beforeEach(() => {
  vi.mocked(api.listTasks).mockReset();
  vi.mocked(api.createTask).mockReset();
});

it('disables "Agregar" and explains why when the user is at the cap', async () => {
  const user = userEvent.setup();
  vi.mocked(api.listTasks).mockResolvedValue(tasks(MAX_TASKS_PER_USER));
  render(<TaskList />);
  await screen.findByText(TASK_LIMIT_MESSAGE);

  await user.type(screen.getByPlaceholderText('Nueva tarea...'), 'Una más');
  const add = screen.getByRole('button', { name: 'Agregar' });

  expect(add).toBeDisabled();
  expect(add).toHaveAccessibleDescription(TASK_LIMIT_MESSAGE);
  expect(api.createTask).not.toHaveBeenCalled();
}, 30000);

it('below the cap the form works and shows no warning', async () => {
  const user = userEvent.setup();
  vi.mocked(api.listTasks).mockResolvedValue(tasks(3));
  render(<TaskList />);
  await screen.findByText('Tarea 3');

  await user.type(screen.getByPlaceholderText('Nueva tarea...'), 'Una más');

  expect(screen.getByRole('button', { name: 'Agregar' })).toBeEnabled();
  expect(screen.queryByText(TASK_LIMIT_MESSAGE)).not.toBeInTheDocument();
});

it('a 409 from the backend shows the same clear message (e.g. another tab added tasks)', async () => {
  const user = userEvent.setup();
  const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
  try {
    vi.mocked(api.listTasks).mockResolvedValue(tasks(3));
    vi.mocked(api.createTask).mockRejectedValueOnce({
      status: 409, detail: 'Alcanzaste el máximo de tareas permitido', code: 'task_limit_reached',
    });
    render(<TaskList />);
    await screen.findByText('Tarea 3');

    await user.type(screen.getByPlaceholderText('Nueva tarea...'), 'Una más');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(await screen.findByText(TASK_LIMIT_MESSAGE)).toBeInTheDocument();
  } finally { spy.mockRestore(); }
});

it('maps only the task-limit 409 to the cap message', () => {
  expect(getApiError({ status: 409, code: 'task_limit_reached', detail: 'x' }).message).toBe(TASK_LIMIT_MESSAGE);
  expect(getApiError({ status: 409, code: 'otro', detail: 'Conflicto' }).message).toBe('Conflicto');
});
