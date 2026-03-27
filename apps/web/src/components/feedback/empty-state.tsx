'use client';

/**
 * EmptyState — Centered placeholder for pages/sections with no data.
 * Shows an icon, title, description, and an optional action (e.g. a button).
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Primary heading */
  title: string;
  /** Supporting text */
  description: string;
  /** Optional action element (e.g. a Button) */
  action?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="mb-4 rounded-full bg-muted p-3">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
