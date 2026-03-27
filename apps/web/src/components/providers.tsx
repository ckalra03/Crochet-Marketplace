'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { SocketProvider } from '@/lib/socket/socket-provider';
import { SocketQueryInvalidator } from '@/lib/socket/socket-query-invalidator';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30 * 1000, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthInitializer>
          <SocketProvider>
            <SocketQueryInvalidator />
            {children}
          </SocketProvider>
          <Toaster position="top-right" richColors />
        </AuthInitializer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
