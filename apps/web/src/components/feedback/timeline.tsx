'use client';

/**
 * Timeline — Vertical timeline showing step progression.
 * Each step can be completed (check mark), current (highlighted), or upcoming (dimmed).
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TimelineStep {
  /** Step label */
  label: string;
  /** Optional description text */
  description?: string;
  /** Optional date string */
  date?: string;
  /** Step state */
  status: 'completed' | 'current' | 'upcoming';
}

interface TimelineProps {
  /** Array of timeline steps in order */
  steps: TimelineStep[];
  /** Additional CSS classes */
  className?: string;
}

function Timeline({ steps, className }: TimelineProps) {
  return (
    <div className={cn('space-y-0', className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <div key={index} className="flex gap-3">
            {/* Dot + connecting line */}
            <div className="flex flex-col items-center">
              {/* Dot */}
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                  step.status === 'completed' && 'border-green-500 bg-green-500 text-white',
                  step.status === 'current' && 'border-primary-600 bg-primary-600 text-white',
                  step.status === 'upcoming' && 'border-gray-300 bg-white',
                )}
              >
                {step.status === 'completed' && <Check className="h-3.5 w-3.5" />}
                {step.status === 'current' && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
              {/* Line */}
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 grow',
                    step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200',
                  )}
                  style={{ minHeight: '2rem' }}
                />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-6', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium leading-6',
                  step.status === 'upcoming' && 'text-muted-foreground',
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-sm text-muted-foreground">{step.description}</p>
              )}
              {step.date && (
                <p className="text-xs text-muted-foreground">{step.date}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { Timeline };
export type { TimelineProps, TimelineStep };
