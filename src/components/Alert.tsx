import type { ReactNode } from 'react';
import { Button } from '@ui-sdk/react/button';
import { XIcon } from './Icons';

const tones = {
  danger: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200',
} as const;

interface Props {
  tone?: keyof typeof tones;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export default function Alert({ tone = 'danger', children, onClose, className = '' }: Props) {
  return (
    <div role="alert" className={`app-alert flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${tones[tone]} ${className}`}>
      <div className="min-w-0 flex-1">{children}</div>
      {onClose && (
        <Button aria-label="Cerrar" className="-me-2 size-8 shrink-0 border-transparent bg-transparent text-current" onClick={onClose}>
          <XIcon />
        </Button>
      )}
    </div>
  );
}
