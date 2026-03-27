import { api } from './client';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

/** Register a new buyer account. */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const res = await api.post('/auth/register', data);
  return res.data;
}

/** Log in with email and password. */
export async function login(data: LoginData): Promise<AuthResponse> {
  const res = await api.post('/auth/login', data);
  return res.data;
}

/** Refresh the access token using a refresh token. */
export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const res = await api.post('/auth/refresh', { refreshToken });
  return res.data;
}

/** Log out and invalidate the refresh token. */
export async function logout(refreshToken: string): Promise<{ message: string }> {
  const res = await api.post('/auth/logout', { refreshToken });
  return res.data;
}

/** Request a password reset email. */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const res = await api.post('/auth/forgot-password', { email });
  return res.data;
}

/** Reset password using a token from the reset link. */
export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  const res = await api.post('/auth/reset-password', { token, password });
  return res.data;
}
