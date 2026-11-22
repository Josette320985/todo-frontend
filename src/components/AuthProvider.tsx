import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as auth from '../api/auth';
import { AUTH_UNAUTHORIZED_EVENT } from '../api/client';
import { getToken } from '../api/token';
import { AuthContext, type AuthContextValue } from '../hooks/useAuth';
import type { UserCreate } from '../types/auth';

/**
 * Owns the session (ARQ-08): whether there is a token, who the user is and
 * why the session ended. The token itself is stored by api/auth.
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setLoggedIn] = useState<boolean>(() => Boolean(getToken()));
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [transitionPending, setTransitionPending] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // The API client clears the token and fires this event on a 401.
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

  useEffect(() => {
    if (!isLoggedIn) return;
    let active = true;
    auth.getCurrentUser()
      .then(data => { if (active) setUserEmail(data.email); })
      .catch(() => { if (active) setUserEmail(''); });
    return () => { active = false; };
  }, [isLoggedIn]);

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
