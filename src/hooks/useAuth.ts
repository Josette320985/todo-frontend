import { createContext, useContext } from 'react';
import type { UserCreate } from '../types/auth';

/**
 * Session state shared by the whole app (ARQ-08).
 *
 * AuthProvider owns it; components read it through useAuth() instead of
 * touching the token or the auth API directly.
 */
export interface AuthContextValue {
  isLoggedIn: boolean;
  /** Email of the signed-in user, once /auth/me answers (UX-14). */
  userEmail: string | null;
  /** True while /auth/me is pending. */
  profileLoading: boolean;
  transitionPending: boolean;
  /** True when the API rejected the stored token with a 401 (UX-06). */
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (user: UserCreate) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
