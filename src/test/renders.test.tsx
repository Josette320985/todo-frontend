import { Profiler, type ComponentProps } from 'react';
import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskList from '../components/TaskList';
const measured = vi.hoisted(() => ({ commits: 0 }));
vi.mock('../api/tasks', () => ({ listTasks: vi.fn().mockResolvedValue(Array.from({ length: 1000 }, (_, index) => ({
  id: index + 1, title: `Tarea ${index + 1}`, completed: false, description: null, start_date: null, end_date: null,
}))) }));
vi.mock('../components/TaskItem', async importOriginal => {
  const { default: Item } = await importOriginal<typeof import('../components/TaskItem')>();
  return { default: (props: ComponentProps<typeof Item>) => <Profiler id={`row-${props.task.id}`} onRender={() => { measured.commits++; }}><Item {...props} /></Profiler> };
});
it('typing into the new-task form commits zero of 1000 real TaskItems', async () => {
  const user = userEvent.setup(); render(<TaskList />);
  await screen.findByText('Tarea 1000');
  const before = measured.commits;
  expect(before).toBeGreaterThanOrEqual(1000);
  await user.type(screen.getByPlaceholderText('Nueva tarea...'), 'rendimiento');
  expect(measured.commits - before).toBe(0);
}, 20_000);
