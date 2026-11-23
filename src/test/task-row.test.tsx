// Task row details: due badge (UX-11).
import { afterEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskItem from '../components/TaskItem';
import type { Task } from '../types/task';

const base: Task = { id: 1, title: 'Tarea', description: null, completed: false, start_date: null, end_date: null };
const renderRow = (task: Task) => render(<ul><TaskItem task={task} editing={false} onEdit={vi.fn()}
  onToggle={vi.fn()} onDelete={vi.fn()} onUpdate={vi.fn()} onError={vi.fn()} /></ul>);

afterEach(() => vi.useRealTimers());

it('shows "Vencida" and "Vence hoy" only on pending tasks (UX-11)', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 21, 12, 0));
  const { unmount } = renderRow({ ...base, end_date: '2026-11-20' });
  expect(screen.getByText('Vencida')).toBeInTheDocument();
  unmount();
  renderRow({ ...base, id: 2, end_date: '2026-11-21' });
  expect(screen.getByText('Vence hoy')).toBeInTheDocument();
  renderRow({ ...base, id: 3, end_date: '2026-11-20', completed: true });
  expect(screen.queryByText('Vencida')).not.toBeInTheDocument();
});

it('shows the description under the title and edits it (UX-12)', async () => {
  const { default: userEvent } = await import('@testing-library/user-event');
  const onUpdate = vi.fn().mockResolvedValue(true);
  const task = { ...base, description: 'Con leche deslactosada' };
  const { rerender } = renderRow(task);
  expect(screen.getByText('Con leche deslactosada')).toHaveClass('task-description');

  rerender(<ul><TaskItem task={task} editing onEdit={vi.fn()} onToggle={vi.fn()} onDelete={vi.fn()}
    onUpdate={onUpdate} onError={vi.fn()} /></ul>);
  const user = userEvent.setup();
  const field = screen.getByLabelText('Descripción (opcional)');
  expect(field).toHaveAttribute('maxlength', '1000');
  await user.clear(field);
  await user.type(field, '  ');
  await user.click(screen.getByRole('button', { name: 'Guardar' }));
  expect(onUpdate).toHaveBeenCalledWith(1, { title: 'Tarea', description: null, start_date: null, end_date: null });
});
