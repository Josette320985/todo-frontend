import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App';
import AuthProvider from './components/AuthProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { activateDeferredCss, installReloadOverlay } from './lib/reloadOverlay';

// Dark mode (UX-22) needs no script: web.css and Tailwind's dark: variant both
// follow prefers-color-scheme.
installReloadOverlay();
activateDeferredCss();

/**
 * Application entry point.
 *
 * Mounts the main App component into the root DOM element.
 * StrictMode enables additional development checks to help
 * identify potential issues in React components.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
