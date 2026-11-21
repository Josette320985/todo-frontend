import { useCallback, useEffect, useState } from 'react';
export function useCooldown() {
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(0);
  const start = useCallback((seconds: number | undefined) => {
    const time = Date.now(); setNow(time); setUntil(time + (seconds ?? 0) * 1000);
  }, []);
  const remaining = Math.max(0, Math.ceil((until - now) / 1000));
  useEffect(() => {
    if (!remaining) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [remaining]);
  return { remaining, start };
}
