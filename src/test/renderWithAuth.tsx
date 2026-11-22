import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import AuthProvider from '../components/AuthProvider';

/** Renders a component inside the real AuthProvider (ARQ-08). */
export const renderWithAuth = (ui: ReactElement) => render(<AuthProvider>{ui}</AuthProvider>);
