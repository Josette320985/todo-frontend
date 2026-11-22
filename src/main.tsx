import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import App from './App';

/**
 * Follows the operating system color-scheme preference (UX-22).
 *
 * Bootstrap 5.3 switches its component palette through the data-bs-theme
 * attribute, but it cannot read the media query on its own. The attribute
 * is set before React renders to avoid a flash of the wrong theme, and it
 * is kept in sync when the user changes the preference while the app is
 * open. The CSP in nginx forbids inline scripts, so this lives here rather
 * than in index.html.
 */
const darkModeQuery: MediaQueryList = window.matchMedia(
  '(prefers-color-scheme: dark)',
);

function applyTheme(isDark: boolean): void {
  document.documentElement.setAttribute(
    'data-bs-theme',
    isDark ? 'dark' : 'light',
  );
}

applyTheme(darkModeQuery.matches);
darkModeQuery.addEventListener('change', (event: MediaQueryListEvent) => {
  applyTheme(event.matches);
});

/**
 * Application entry point.
 *
 * Mounts the main App component into the root DOM element.
 * StrictMode enables additional development checks to help
 * identify potential issues in React components.
 *
 * Bootstrap styles are imported globally for the application.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
