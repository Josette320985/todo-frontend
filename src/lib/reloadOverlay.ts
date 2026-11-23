const RELOADING_CLASS = 'is-reloading';

let showReloading: (() => void) | undefined;
let restorePage: (() => void) | undefined;

export function installReloadOverlay(): void {
  if (showReloading) return;
  showReloading = () => { document.documentElement.classList.add(RELOADING_CLASS); };
  restorePage = () => { document.documentElement.classList.remove(RELOADING_CLASS); };
  window.addEventListener('beforeunload', showReloading);
  window.addEventListener('pagehide', showReloading);
  window.addEventListener('pageshow', restorePage);
}

export function uninstallReloadOverlay(): void {
  if (!showReloading || !restorePage) return;
  window.removeEventListener('beforeunload', showReloading);
  window.removeEventListener('pagehide', showReloading);
  window.removeEventListener('pageshow', restorePage);
  showReloading = undefined;
  restorePage = undefined;
}

export function activateDeferredCss(): void {
  document.querySelectorAll<HTMLLinkElement>('link[data-deferred-css]').forEach(link => { link.media = 'all'; });
}

export function removeBootSkeleton(): void {
  document.getElementById('boot-skeleton')?.setAttribute('hidden', '');
}
