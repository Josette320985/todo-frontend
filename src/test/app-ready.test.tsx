import { expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAppReady } from '../hooks/useAppReady';

it('detects load completing between render and subscription', () => {
  const state = vi.spyOn(document, 'readyState', 'get').mockReturnValueOnce('loading').mockReturnValue('complete');
  try {
    const { result } = renderHook(useAppReady);
    expect(result.current).toBe(true);
  } finally { state.mockRestore(); }
});

it('waits for load when the document is still loading', () => {
  const state = vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
  try {
    const { result } = renderHook(useAppReady);
    expect(result.current).toBe(false);
    act(() => { state.mockReturnValue('complete'); window.dispatchEvent(new Event('load')); });
    expect(result.current).toBe(true);
  } finally { state.mockRestore(); }
});
