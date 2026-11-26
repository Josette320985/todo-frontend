import api from './client';
import type { UserCreate, UserRead } from '../types/auth';

export type EmailValidation = { valid: true; normalized: string } | { valid: false; message: string };
export const validateRegistrationEmail = async (email: string): Promise<EmailValidation> =>
  (await api.post<EmailValidation>('/v1/auth/validate-email', { email })).data;

/**
 * Hash the password with SHA-256 (64 lowercase hex chars) before sending it
 * in the request payload so the plaintext password is never transmitted.
 */
export async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export const register = async (user: UserCreate): Promise<UserRead> => {
  const hashedPassword = await hashPassword(user.password);
  return (await api.post<UserRead>('/v1/auth/register', { email: user.email, password: hashedPassword })).data;
};
export const getCurrentUser = async (): Promise<UserRead> => (await api.get<UserRead>('/v1/auth/me')).data;
export async function login(email: string, password: string): Promise<void> {
  const hashedPassword = await hashPassword(password);
  await api.post('/v1/auth/login', new URLSearchParams({ username: email, password: hashedPassword }));
}
export async function logout(): Promise<void> {
  await api.post('/v1/auth/logout');
}
