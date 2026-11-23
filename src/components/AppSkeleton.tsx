import Skeleton from './Skeleton';
import { cardClass } from '../lib/ui';

export default function AppSkeleton() {
  return (
    <div className="fixed inset-0 z-[5000] overflow-auto bg-neutral-50 pb-16 dark:bg-neutral-950" role="status" aria-label="Cargando la aplicación">
      <nav className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Skeleton width="7rem" height="1.25rem" className="me-auto" />
        </div>
      </nav>
      <div className="mx-auto max-w-3xl px-4">
        <div className={`${cardClass} max-w-2xl`}>
          <Skeleton width="8rem" height="1.75rem" className="mb-6" />
          <Skeleton width="100%" height="2.5rem" className="mb-3" />
          <Skeleton width="100%" height="2.25rem" className="mb-3" />
          <Skeleton width="6rem" height="2.25rem" className="mb-6" />
          <ul aria-hidden="true" className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {['85%', '70%', '78%'].map(width => (
              <li key={width} className="flex items-center gap-3 px-4 py-4">
                <Skeleton width="1rem" height="1rem" />
                <Skeleton width={width} height="1rem" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
