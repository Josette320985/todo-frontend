import { useEffect, useState } from 'react';
import { removeBootSkeleton } from '../lib/reloadOverlay';

export function useAppReady(): boolean {
  const [ready, setReady] = useState<boolean>(() => document.readyState === 'complete');
  useEffect(() => {
    if (ready) {
      removeBootSkeleton();
      return;
    }
    const finish = (): void => { setReady(true); };
    window.addEventListener('load', finish);
    return () => { window.removeEventListener('load', finish); };
  }, [ready]);
  return ready;
}
