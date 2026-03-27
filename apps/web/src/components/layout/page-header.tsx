'use client';

/**
 * PageHeader — Consistent page header with title, optional description, and action buttons.
 * Supports breadcrumb content passed as a ReactNode.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle / description */
  description?: string;
  /** Optional action elements (buttons, links) rendered on the right */
  actions?: ReactNode;
  /** Optional breadcrumb content rendered above the title */
  breadcrumbs?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

function PageHeader({ title, description, actions, breadcrumbs, className }: PageHeaderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {breadcrumbs && <div>{breadcrumbs}</div>}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export { PageHeader };
export type { PageHeaderProps };
