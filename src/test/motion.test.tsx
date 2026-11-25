// UX-17: exit animation of a task row.
import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { animateRowExit } from '../lib/motion';
import TaskItem from '../components/TaskItem';
import type { Task } from '../types/task';

type Frames = Keyframe[];

/** A row whose animate() records each call and finishes immediately. */
function fakeRow() {
  const row = document.createElement('div');
  const calls: { frames: Frames; animation: { cancel: ReturnType<typeof vi.fn> } }[] = [];
  row.animate = vi.fn((frames: Frames) => {
    const animation = { finished: Promise.resolve(), cancel: vi.fn() };
    calls.push({ frames, animation });
    return animation as unknown as Animation;
  }) as unknown as typeof row.animate;
  return { row, calls };
}

function setReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduce }) as unknown as typeof window.matchMedia;
}

const originalMatchMedia = window.matchMedia;
afterEach(() => { window.matchMedia = originalMatchMedia; });

it('fades the row out and then collapses its height', async () => {
  setReducedMotion(false);
  const { row, calls } = fakeRow();

  await animateRowExit(row);

  expect(calls).toHaveLength(2);
  expect(calls[0].frames).toEqual([{ opacity: 1 }, { opacity: 0 }]);
  expect(calls[1].frames[1]).toMatchObject({ height: '0px', paddingTop: '0px', paddingBottom: '0px' });
});

it('only fades with prefers-reduced-motion (UX-21)', async () => {
  setReducedMotion(true);
  const { row, calls } = fakeRow();

  await animateRowExit(row);

  expect(calls).toHaveLength(1);
  expect(calls[0].frames).toEqual([{ opacity: 1 }, { opacity: 0 }]);
});

it('restore() cancels the animations so the row comes back', async () => {
  setReducedMotion(false);
  const { row, calls } = fakeRow();

  const exit = await animateRowExit(row);
  exit.restore();

  for (const call of calls) expect(call.animation.cancel).toHaveBeenCalled();
  expect(row.style.overflow).toBe('');
});

it('does nothing where the Web Animations API is missing', async () => {
  const row = document.createElement('div');
  Object.defineProperty(row, 'animate', { value: undefined });

  await expect(animateRowExit(row)).resolves.toHaveProperty('restore');
});

it('brings the row back when the delete request fails', async () => {
  setReducedMotion(true);
  const task: Task = { id: 3, title: 'No se borra', description: null, completed: false, start_date: null, end_date: null };
  const task: Task = { id: '00000000-0000-4000-8000-000000000003', title: 'No se borra', description: null, completed: false, start_date: null, end_date: null };
  const cancels: ReturnType<typeof vi.fn>[] = [];
  const animate = vi.fn(() => {
    const cancel = vi.fn(); cancels.push(cancel);
    return { finished: Promise.resolve(), cancel } as unknown as Animation;
  });
  // jsdom has no Web Animations API: install a fake one for this test only.
  Object.defineProperty(HTMLElement.prototype, 'animate', { value: animate, configurable: true, writable: true });
  try {
    const onDelete = vi.fn().mockResolvedValue(false);
    const user = userEvent.setup();
    render(<TaskItem task={task} editing={false} onEdit={vi.fn()} onToggle={vi.fn()} onDelete={onDelete}
      onUpdate={vi.fn()} onError={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Eliminar: No se borra' }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(3));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000003'));
    await waitFor(() => expect(cancels[0]).toHaveBeenCalled());
    // The animation ran before the request.
    expect(animate.mock.invocationCallOrder[0]).toBeLessThan(onDelete.mock.invocationCallOrder[0]);
  } finally { delete (HTMLElement.prototype as { animate?: unknown }).animate; }
});
