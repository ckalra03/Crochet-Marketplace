'use client';

/**
 * KpiCardGrid — Responsive grid wrapper for KpiCard components.
 * 1 column on mobile, 2 on md, 4 on lg.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface KpiCardGridProps {
  children: ReactNode;
  className?: string;
}

function KpiCardGrid({ children, className }: KpiCardGridProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {children}
    </div>
  );
}

export { KpiCardGrid };
export type { KpiCardGridProps };
