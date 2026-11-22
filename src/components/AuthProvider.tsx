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
  const [sessionExpired, setSessionExpired] = useState(false);

  // The API client clears the token and fires this event on a 401.
  useEffect(() => {
    const handleUnauthorized = (): void => {
      setLoggedIn(false);
      setUserEmail(null);
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
      .catch(() => { if (active) setUserEmail(null); });
    return () => { active = false; };
  }, [isLoggedIn]);

  const login = useCallback(async (email: string, password: string) => {
    await auth.login(email, password);
    setSessionExpired(false);
    setLoggedIn(true);
  }, []);

  const register = useCallback(async (user: UserCreate) => {
    await auth.register(user);
  }, []);

  // Revokes the token on the server (best effort) and always ends the local session.
  const logout = useCallback(async () => {
    await auth.logout().catch(() => undefined);
    setLoggedIn(false);
    setUserEmail(null);
    setSessionExpired(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isLoggedIn, userEmail, sessionExpired, login, register, logout }),
    [isLoggedIn, userEmail, sessionExpired, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
