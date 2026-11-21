import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskList from '../components/TaskList';
import { logApiError } from '../api/logError';
vi.mock('../api/tasks', () => ({ listTasks: vi.fn().mockResolvedValue([]) }));
it('renders the list using an API-layer mock', async () => {
  render(<TaskList />);
  expect(await screen.findByText('No hay tareas pendientes.')).toBeInTheDocument();
});
it('never logs request tokens or arbitrary messages', () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  logApiError('Error', { message: 'Bearer SECRET', config: { headers: { Authorization: 'Bearer SECRET' } }, response: { status: 500 } });
  expect(spy).toHaveBeenCalledWith('Error', { status: 500 });
  expect(JSON.stringify(spy.mock.calls)).not.toContain('SECRET');
  spy.mockRestore();
});
