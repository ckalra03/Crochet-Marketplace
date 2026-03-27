'use client';

/**
 * KpiCard — Dashboard card displaying a key metric with optional trend indicator.
 */

import type { LucideIcon } from 'lucide-react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

interface KpiCardProps {
  /** Metric label */
  title: string;
  /** Main display value (already formatted) */
  value: string;
  /** Supporting text below the value */
  description?: string;
  /** Optional Lucide icon */
  icon?: LucideIcon;
  /** Optional trend indicator */
  trend?: {
    /** Percentage value (e.g. 12.5) */
    value: number;
    /** Whether the trend direction is positive */
    isPositive: boolean;
  };
  /** Additional CSS classes */
  className?: string;
}

function KpiCard({ title, value, description, icon: Icon, trend, className }: KpiCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="mt-1 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center text-xs font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600',
              )}
            >
              {trend.isPositive ? (
                <ArrowUp className="mr-0.5 h-3 w-3" />
              ) : (
                <ArrowDown className="mr-0.5 h-3 w-3" />
              )}
              {trend.value}%
            </span>
          )}
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { KpiCard };
export type { KpiCardProps };
