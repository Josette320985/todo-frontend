import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom gaps ui-sdk needs, from its testing guide. CSS.supports is not in that
// list but Textarea's autoResize calls it.
HTMLElement.prototype.showPopover = function () {};
HTMLElement.prototype.hidePopover = function () {};
Element.prototype.getAnimations = () => [];
Element.prototype.scrollIntoView = function () {};
Element.prototype.checkVisibility = () => true;
Element.prototype.getClientRects = () => [] as unknown as DOMRectList;
document.elementFromPoint = () => null;
document.elementsFromPoint = () => [];
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
globalThis.CSS ??= {} as typeof CSS;
CSS.supports ??= () => false;
document.head.append(
  Object.assign(document.createElement('style'), {
    textContent: '[popover] { display: block !important }',
  }),
);

afterEach(() => { cleanup(); localStorage.clear(); });
