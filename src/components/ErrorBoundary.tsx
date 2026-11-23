import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@ui-sdk/react/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches unhandled rendering errors in the subtree and shows a recovery
 * screen instead of a blank page.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-neutral-50 p-6 text-center text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
          <h1 className="text-3xl font-semibold tracking-tight">Algo salió mal</h1>
          {isDev && this.state.error ? (
            <pre className="max-w-full overflow-auto rounded-lg border border-neutral-200 bg-white p-4 text-start text-xs dark:border-neutral-800 dark:bg-neutral-900">
              {this.state.error.stack ?? this.state.error.message}
            </pre>
          ) : null}
          <Button data-variant="solid" className="h-10 px-5" onClick={this.handleReload}>
            Recargar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
