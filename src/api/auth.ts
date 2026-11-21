import api from './client';
import { clearToken, setToken } from './token';
import type { TokenResponse, UserCreate, UserRead } from '../types/auth';

export const register = async (user: UserCreate): Promise<UserRead> => (await api.post<UserRead>('/v1/auth/register', user)).data;
export async function login(email: string, password: string): Promise<void> {
  const { data } = await api.post<TokenResponse>('/v1/auth/login', new URLSearchParams({ username: email, password }));
  setToken(data.access_token);
}
export async function logout(): Promise<void> {
  try { await api.post('/v1/auth/logout'); } finally { clearToken(); }
}
