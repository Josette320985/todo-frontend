import { expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskList from '../components/TaskList';
import * as api from '../api/tasks';
import { compareTasks, isPendingFirstSort, sortPendingFirst } from '../lib/taskOrder';
import type { Task } from '../types/task';

// Local re-sort after a change: pending first, completed last, same order as the backend (OPT-02).
vi.mock('../api/tasks', () => ({ listTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), removeTask: vi.fn() }));

const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const task = (id: number, title: string, completed = false, end_date: string | null = null): Task =>
  ({ id, title, description: null, completed, start_date: null, end_date });
({ id: uid(id), title, description: null, completed, start_date: null, end_date });

let rows: Task[];

beforeEach(() => {
  vi.mocked(api.listTasks).mockReset().mockImplementation(async () => [...rows]);
  vi.mocked(api.createTask).mockReset();
  vi.mocked(api.removeTask).mockReset().mockResolvedValue();
  vi.mocked(api.updateTask).mockReset().mockImplementation(async (id, data) => {
    const saved = { ...rows.find(item => item.id === id)!, ...data } as Task;
    rows = rows.map(item => item.id === id ? saved : item);
    return saved;
  });
});

const order = () => screen.getAllByRole('checkbox').map(checkbox => checkbox.getAttribute('id'));

it('moves a task that goes back to pending to its place, without reloading', async () => {
  // Backend order: B (pending) first, A (completed) last.
  rows = [task(2, 'B'), task(1, 'A', true)];
  const user = userEvent.setup();
  render(<TaskList />);
  await screen.findByText('B');
  expect(order()).toEqual(['task-2', 'task-1']);
  expect(order()).toEqual([`task-${uid(2)}`, `task-${uid(1)}`]);

  await user.click(screen.getByRole('checkbox', { name: 'A' }));

  // A (id 1) is pending again and sorts before B (id 2), like the backend would.
  await waitFor(() => expect(order()).toEqual(['task-1', 'task-2']));
  await waitFor(() => expect(order()).toEqual([`task-${uid(1)}`, `task-${uid(2)}`]));
  expect(api.listTasks).toHaveBeenCalledTimes(1);
});

it('sends a task that gets completed below the pending ones', async () => {
  rows = [task(1, 'A'), task(2, 'B')];
  const user = userEvent.setup();
  render(<TaskList />);
  await screen.findByText('A');

  await user.click(screen.getByRole('checkbox', { name: 'A' }));

  await waitFor(() => expect(order()).toEqual(['task-2', 'task-1']));
  await waitFor(() => expect(order()).toEqual([`task-${uid(2)}`, `task-${uid(1)}`]));
});

it('puts a task that returns to pending by its due date, not at the end of the group', async () => {
  rows = [task(2, 'Tarde', false, '2026-12-31'), task(3, 'Sin fecha'), task(1, 'Pronto', true, '2026-06-01')];
  const user = userEvent.setup();
  render(<TaskList />);
  await screen.findByText('Pronto');

  await user.click(screen.getByRole('checkbox', { name: 'Pronto' }));

  await waitFor(() => expect(order()).toEqual(['task-1', 'task-2', 'task-3']));
  await waitFor(() => expect(order()).toEqual([`task-${uid(1)}`, `task-${uid(2)}`, `task-${uid(3)}`]));
});

it('isPendingFirstSort only accepts the pending-first orders', () => {
  expect(isPendingFirstSort('')).toBe(true);
  expect(isPendingFirstSort('', 'desc')).toBe(true); // backend ignores order without fields
  expect(isPendingFirstSort('completed,end_date,id')).toBe(true);
  expect(isPendingFirstSort('completed,end_date,id', 'asc')).toBe(true);
  expect(isPendingFirstSort('completed,end_date,id', 'desc')).toBe(false);
  expect(isPendingFirstSort('title')).toBe(false);
  expect(isPendingFirstSort('end_date,id')).toBe(false);
});

it('sortPendingFirst mirrors the backend order and does not mutate its input', () => {
  const list = [
    task(5, 'e', true, '2026-01-01'), task(4, 'd'), task(3, 'c', false, '2026-09-01'),
    task(2, 'b', false, '2026-03-01'), task(1, 'a', true),
  ];
  const snapshot = list.map(item => item.id);

  expect(sortPendingFirst(list).map(item => item.id)).toEqual([2, 3, 4, 5, 1]);
  expect(sortPendingFirst(list).map(item => item.id)).toEqual([2, 3, 4, 5, 1].map(uid));
  expect(list.map(item => item.id)).toEqual(snapshot);
  expect(compareTasks(list[0], list[0])).toBe(0);
});