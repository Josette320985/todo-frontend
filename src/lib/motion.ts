/**
 * Exit animation of a task row (UX-17).
 *
 * The row first fades out (150 ms, --duration-fast) and then collapses its
 * height so the rows below slide up instead of jumping. Running the two
 * steps one after the other keeps the fade and the collapse from fighting.
 *
 * With prefers-reduced-motion only the fade runs (UX-21 keeps fades and
 * drops movement). Where the Web Animations API is missing (old browsers,
 * jsdom in tests) the row is removed without animation.
 */
export interface RowExit {
  /** Bring the row back, for example when the delete request fails. */
  restore: () => void;
}

const FADE_MS = 150;
const COLLAPSE_MS = 150;
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export async function animateRowExit(row: HTMLElement): Promise<RowExit> {
  if (typeof row.animate !== 'function') return { restore: () => {} };
  const animations: Animation[] = [];
  const restore = () => {
    animations.forEach(animation => animation.cancel());
    row.style.overflow = '';
  };

  const fade = row.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: EASE_IN, fill: 'forwards' });
  animations.push(fade);
  await fade.finished.catch(() => undefined);
  if (prefersReducedMotion()) return { restore };

  const style = getComputedStyle(row);
  row.style.overflow = 'hidden';
  const collapse = row.animate([
    {
      height: `${row.offsetHeight}px`,
      paddingTop: style.paddingTop, paddingBottom: style.paddingBottom,
      borderTopWidth: style.borderTopWidth, borderBottomWidth: style.borderBottomWidth,
    },
    { height: '0px', paddingTop: '0px', paddingBottom: '0px', borderTopWidth: '0px', borderBottomWidth: '0px' },
  ], { duration: COLLAPSE_MS, easing: 'ease', fill: 'forwards' });
  animations.push(collapse);
  await collapse.finished.catch(() => undefined);
  return { restore };
}
