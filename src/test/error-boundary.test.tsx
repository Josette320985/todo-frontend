// TEST-08 / ERR-08: the error boundary shows a recovery screen instead of a
// blank page when a component throws while rendering.
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../components/ErrorBoundary';

function Broken(): never {
  throw new Error('render exploded');
}

let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  // React and the boundary both report the caught error; keep the output clean.
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  consoleError.mockRestore();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it('renders its children while nothing fails', () => {
  render(<ErrorBoundary><p>Todo bien</p></ErrorBoundary>);

  expect(screen.getByText('Todo bien')).toBeInTheDocument();
  expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument();
});

it('shows the recovery screen when a child throws while rendering', () => {
  render(<ErrorBoundary><Broken /></ErrorBoundary>);

  expect(screen.getByRole('heading', { name: 'Algo salió mal' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Recargar' })).toBeInTheDocument();
  expect(consoleError).toHaveBeenCalled();
});

it('reloads the page from the recovery screen', async () => {
  const reload = vi.fn();
  vi.stubGlobal('location', { ...window.location, reload });
  const user = userEvent.setup();
  render(<ErrorBoundary><Broken /></ErrorBoundary>);

  await user.click(screen.getByRole('button', { name: 'Recargar' }));

  expect(reload).toHaveBeenCalledTimes(1);
});

it('hides the error details outside development', () => {
  vi.stubEnv('DEV', false);
  render(<ErrorBoundary><Broken /></ErrorBoundary>);

  expect(screen.getByRole('heading', { name: 'Algo salió mal' })).toBeInTheDocument();
  expect(screen.queryByText(/render exploded/)).not.toBeInTheDocument();
});

it('shows the error details in development to help debugging', () => {
  vi.stubEnv('DEV', true);
  render(<ErrorBoundary><Broken /></ErrorBoundary>);

  expect(screen.getByText(/render exploded/)).toBeInTheDocument();
});
