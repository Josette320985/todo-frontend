import { screen, waitFor } from '@testing-library/react';

// ui-sdk keeps a hidden live region of its own (data-ui-sdk-announcer) that
// also has role="alert"; these helpers return only the app's alerts.
const isAppAlert = (element: HTMLElement) => !element.hasAttribute('data-ui-sdk-announcer');

export function queryAppAlert(): HTMLElement | null {
  return screen.queryAllByRole('alert').find(isAppAlert) ?? null;
}

export function findAppAlert(): Promise<HTMLElement> {
  return waitFor(() => {
    const alert = queryAppAlert();
    if (!alert) throw new Error('No app alert in the document');
    return alert;
  });
}
