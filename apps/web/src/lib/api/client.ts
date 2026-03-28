import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// --- Silent token refresh state ---
// When a refresh is in progress, all subsequent 401 requests wait on this promise
// instead of triggering redundant refresh calls.
let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempt to get a new access token using the stored refresh token.
 * Returns the new access token on success, or null on failure.
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    // Use a plain axios call (not `api`) to avoid triggering our own interceptors
    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

// Attach auth token OR guest session ID to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Authenticated user — use JWT
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Guest user — generate and attach session ID for cart operations
      let sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('sessionId', sessionId);
      }
      config.headers['X-Session-ID'] = sessionId;
    }
  }
  return config;
});

// Handle 401 — attempt silent refresh, then retry or redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retried?: boolean };

    // Only attempt refresh on 401, in the browser, and not for already-retried requests
    if (
      error.response?.status !== 401 ||
      typeof window === 'undefined' ||
      originalRequest._retried
    ) {
      return Promise.reject(error);
    }

    // Don't try to refresh if the failing request was the refresh call itself
    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // Mark so we don't retry infinitely
    originalRequest._retried = true;

    // If a refresh is already in progress, wait for it instead of starting another
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;

    if (newToken) {
      // Refresh succeeded — retry the original request with the new token
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    }

    // Refresh failed — clear tokens and redirect to login
    // But don't redirect for guest cart requests (they don't need auth)
    const isCartRequest = originalRequest.url?.includes('/cart');
    const hadToken = !!localStorage.getItem('accessToken');

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    if (hadToken && !isCartRequest && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export default api;
