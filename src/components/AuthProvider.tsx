import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as auth from '../api/auth';
import { AUTH_UNAUTHORIZED_EVENT } from '../api/client';
import { AuthContext, type AuthContextValue } from '../hooks/useAuth';
import type { UserCreate } from '../types/auth';

/**
 * Owns the session (ARQ-08): whether there is an active HttpOnly cookie session,
 * who the user is and why the session ended.
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setLoggedIn] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [transitionPending, setTransitionPending] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const initialCheckDone = useRef(false);

  // The API client fires this event when a protected request returns 401.
  useEffect(() => {
    const handleUnauthorized = (): void => {
      setLoggedIn(false);
      setUserEmail(null);
      setTransitionPending(false);
      setSessionExpired(true);
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  // Probe the HttpOnly cookie session on mount, and load the profile after login.
  useEffect(() => {
    if (!isLoggedIn && initialCheckDone.current) return;
    if (isLoggedIn && userEmail !== null) return;
    initialCheckDone.current = true;
    let active = true;
    auth.getCurrentUser()
      .then(data => {
        if (!active) return;
        setLoggedIn(true);
        setUserEmail(data.email);
      })
      .catch(() => {
        if (!active) return;
        if (isLoggedIn) setUserEmail('');
      });
    return () => { active = false; };
  }, [isLoggedIn, userEmail]);

  const login = useCallback(async (email: string, password: string) => {
    setTransitionPending(true);
    setSessionExpired(false);
    try {
      await auth.login(email, password);
      setLoggedIn(true);
    } finally {
      setTransitionPending(false);
    }
  }, []);

  const register = useCallback(async (user: UserCreate) => {
    setTransitionPending(true);
    try {
      await auth.register(user);
    } finally {
      setTransitionPending(false);
    }
  }, []);

  // Revokes the token on the server (best effort) and always ends the local session.
  const logout = useCallback(async () => {
    setTransitionPending(true);
    setLoggedIn(false);
    setUserEmail(null);
    setSessionExpired(false);
    try {
      await auth.logout().catch(() => undefined);
    } finally {
      setTransitionPending(false);
      setSessionExpired(false);
    }
  }, []);

  const profileLoading = isLoggedIn && userEmail === null;
  const value = useMemo<AuthContextValue>(
    () => ({ isLoggedIn, userEmail, profileLoading, transitionPending, sessionExpired, login, register, logout }),
    [isLoggedIn, userEmail, profileLoading, transitionPending, sessionExpired, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
