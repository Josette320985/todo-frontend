import { useEffect, useSyncExternalStore } from 'react';
import { removeBootSkeleton } from '../lib/reloadOverlay';

const isReady = () => document.readyState === 'complete';
const subscribe = (notify: () => void) => {
  window.addEventListener('load', notify);
  return () => window.removeEventListener('load', notify);
};

export function useAppReady(): boolean {
  // Re-check the snapshot after subscribing: load may finish between render
  // and the effect, otherwise the application can remain inert indefinitely.
  const ready = useSyncExternalStore(subscribe, isReady, () => false);
  useEffect(() => {
    if (ready) {
      removeBootSkeleton();
      return;
    }
  }, [ready]);
  return ready;
}
