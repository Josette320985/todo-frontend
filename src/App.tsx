import type { JSX } from 'react';
import { Button } from '@ui-sdk/react/button';
import { useAuth } from './hooks/useAuth';
import { useAppReady } from './hooks/useAppReady';
import AppSkeleton from './components/AppSkeleton';
import Skeleton from './components/Skeleton';
import LoginForm from './components/LoginForm';
import TaskList from './components/TaskList';
import Alert from './components/Alert';
import { LogoIcon } from './components/Icons';

/**
 * Application shell: header plus the login form or the task list.
 * The session itself lives in AuthProvider (ARQ-08).
 */
export default function App(): JSX.Element {
  const ready = useAppReady();
  const { isLoggedIn, userEmail, profileLoading, transitionPending, sessionExpired, logout } = useAuth();
  const showSkeleton = !ready || transitionPending;

  return (
    <>
      <div className="min-h-dvh bg-neutral-50 pb-16 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50" aria-hidden={showSkeleton || undefined} inert={showSkeleton}>
        <nav className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
          <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
            <span className="me-auto flex items-center gap-2 text-base font-semibold tracking-tight">
              <span className="text-[var(--ui-primary)]"><LogoIcon /></span>
              Mis Tareas
            </span>
            {isLoggedIn && (
              <div className="flex min-w-0 items-center gap-3">
                {profileLoading ? <Skeleton width="10rem" height="1rem" /> : userEmail && (
                  <span className="max-w-[40vw] truncate text-sm text-neutral-500 sm:max-w-64 dark:text-neutral-400" title={userEmail}>
                    {userEmail}
                  </span>
                )}
                <Button onClick={() => logout()}>Cerrar Sesión</Button>
              </div>
            )}
          </div>
        </nav>
        <main className="mx-auto max-w-3xl px-4">
          {isLoggedIn ? <TaskList /> : <>
            {sessionExpired && (
              <Alert tone="warning" className="mx-auto mt-10 mb-0 max-w-md">
                Tu sesión expiró. Vuelve a iniciar sesión.
              </Alert>
            )}
            <LoginForm />
          </>}
        </main>
      </div>
      {showSkeleton && <AppSkeleton />}
    </>
  );
}
