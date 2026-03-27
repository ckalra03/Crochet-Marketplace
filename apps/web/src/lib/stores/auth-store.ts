'use client';
import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  sellerProfile?: { id: string; businessName: string; status: string } | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

/**
 * Set the accessToken cookie so the Next.js edge middleware can read it.
 * Max-age is 900s (15 min) to match the JWT expiry.
 */
function setAccessTokenCookie(token: string): void {
  document.cookie = `accessToken=${token}; path=/; max-age=900; SameSite=Lax`;
}

/**
 * Clear the accessToken cookie by setting max-age to 0.
 */
function clearAccessTokenCookie(): void {
  document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    // Sync token to cookie for edge middleware route protection
    setAccessTokenCookie(accessToken);

    set({ user, accessToken, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // Clear the cookie so middleware redirects to login
    clearAccessTokenCookie();

    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        // Re-sync cookie on hydration (e.g., page reload)
        setAccessTokenCookie(token);
        set({ user, accessToken: token, isAuthenticated: true });
      } catch {
        set({ user: null, accessToken: null, isAuthenticated: false });
      }
    }
  },
}));
