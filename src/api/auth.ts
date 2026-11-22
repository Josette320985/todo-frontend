import api from './client';
import { clearToken, setToken } from './token';
import type { TokenResponse, UserCreate, UserRead } from '../types/auth';

export type EmailValidation = { valid: true; normalized: string } | { valid: false; message: string };
export const validateRegistrationEmail = async (email: string): Promise<EmailValidation> =>
  (await api.post<EmailValidation>('/v1/auth/validate-email', { email })).data;

export const register = async (user: UserCreate): Promise<UserRead> => (await api.post<UserRead>('/v1/auth/register', user)).data;
export const getCurrentUser = async (): Promise<UserRead> => (await api.get<UserRead>('/v1/auth/me')).data;
export async function login(email: string, password: string): Promise<void> {
  const { data } = await api.post<TokenResponse>('/v1/auth/login', new URLSearchParams({ username: email, password }));
  setToken(data.access_token);
}
export async function logout(): Promise<void> {
  try { await api.post('/v1/auth/logout'); } finally { clearToken(); }
}
