'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login, register, logout, forgotPassword, resetPassword } from '@/lib/api/auth';
import type { LoginData, RegisterData } from '@/lib/api/auth';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuthStore } from '@/lib/stores/auth-store';

/** Mutation to log in with email and password. Updates auth store on success. */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginData) => login(data),
    onSuccess: (data) => {
      useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}

/** Mutation to register a new buyer account. Updates auth store on success. */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) => register(data),
    onSuccess: (data) => {
      useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}

/** Mutation to log out. Clears auth store and query cache on success. */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (refreshToken: string) => logout(refreshToken),
    onSuccess: () => {
      useAuthStore.getState().logout();
      queryClient.clear();
    },
  });
}

/** Mutation to request a password reset email. */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => forgotPassword(email),
  });
}

/** Mutation to reset the password using a token. */
export function useResetPassword() {
  return useMutation({
    mutationFn: (data: { token: string; password: string }) =>
      resetPassword(data.token, data.password),
  });
}
