import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activateDeferredCss, installReloadOverlay, removeBootSkeleton, uninstallReloadOverlay } from '../lib/reloadOverlay';

describe('reload overlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    uninstallReloadOverlay();
    document.body.innerHTML = '<div id="boot-skeleton"></div><div id="root"></div><link rel="stylesheet" media="print" data-deferred-css href="/assets/index.css">';
  });

  afterEach(() => {
    uninstallReloadOverlay();
    vi.useRealTimers();
  });

  it('oculta la app de inmediato al empezar la recarga', () => {
    installReloadOverlay();
    window.dispatchEvent(new Event('beforeunload'));
    expect(document.documentElement).toHaveClass('is-reloading');
  });

  it('no restaura la app con un temporizador mientras la página vieja sigue visible', () => {
    installReloadOverlay();
    window.dispatchEvent(new Event('beforeunload'));
    expect(document.documentElement).toHaveClass('is-reloading');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('restaura la app cuando el documento nuevo hace pageshow', () => {
    installReloadOverlay();
    window.dispatchEvent(new Event('pagehide'));
    expect(document.documentElement).toHaveClass('is-reloading');
    window.dispatchEvent(new Event('pageshow'));
    expect(document.documentElement).not.toHaveClass('is-reloading');
  });

  it('activa el CSS deferido cuando React ya puede renderizar', () => {
    activateDeferredCss();
    expect(document.querySelector('link[data-deferred-css]')).toHaveAttribute('media', 'all');
  });

  it('oculta el skeleton estático cuando React ya puede renderizar', () => {
    const shell = document.getElementById('boot-skeleton');
    expect(shell).not.toHaveAttribute('hidden');
    removeBootSkeleton();
    expect(shell).toHaveAttribute('hidden');
  });
});
