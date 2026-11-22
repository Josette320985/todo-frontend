import { Component, type ErrorInfo, type ReactNode } from 'react';

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
        <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 p-4 text-center">
          <h1 className="mb-3">Algo salió mal</h1>
          {isDev && this.state.error ? (
            <pre
              className="text-start bg-light p-3 rounded mb-3"
              style={{ maxWidth: '100%', overflow: 'auto' }}
            >
              {this.state.error.stack ?? this.state.error.message}
            </pre>
          ) : null}
          <button
            type="button"
            className="btn btn-primary"
            onClick={this.handleReload}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
