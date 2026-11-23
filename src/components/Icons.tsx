const iconProps = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false } as const;

export function PencilIcon() {
  return <svg {...iconProps}><path d="M21.17 6.81a2.83 2.83 0 0 0-4-4L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" /><path d="m15 5 4 4" /></svg>;
}

export function TrashIcon() {
  return <svg {...iconProps}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>;
}

export function XIcon() {
  return <svg {...iconProps} width={16} height={16}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
}

export function LogoIcon() {
  return <svg {...iconProps} width={22} height={22}><rect x="3" y="3" width="18" height="18" rx="5" /><path d="m8 12 3 3 5-6" /></svg>;
}
