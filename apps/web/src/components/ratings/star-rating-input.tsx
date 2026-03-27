'use client';

/**
 * StarRatingInput -- Interactive star selector for rating 1-5.
 *
 * Features:
 * - Click to select rating (1-5)
 * - Hover preview (stars fill on hover)
 * - Keyboard navigable (Left/Right arrows, Enter/Space to select)
 * - Controlled component: value + onChange props
 */

import { useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface StarRatingInputProps {
  /** Current selected value (1-5), 0 means no selection */
  value: number;
  /** Callback when user selects a rating */
  onChange: (rating: number) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
}

function StarRatingInput({ value, onChange, disabled = false, className }: StarRatingInputProps) {
  // Track which star the user is hovering over (0 = none)
  const [hoverValue, setHoverValue] = useState(0);

  /** The effective display value: hover takes priority over selected value */
  const displayValue = hoverValue || value;

  /** Handle keyboard navigation */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, starIndex: number) => {
      if (disabled) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = Math.min(starIndex + 1, 5);
        onChange(next);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        const prev = Math.max(starIndex - 1, 1);
        onChange(prev);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange(starIndex);
      }
    },
    [disabled, onChange],
  );

  return (
    <div
      className={cn('inline-flex items-center gap-1', className)}
      role="radiogroup"
      aria-label="Star rating"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayValue;

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            tabIndex={star === value || (value === 0 && star === 1) ? 0 : -1}
            disabled={disabled}
            onClick={() => !disabled && onChange(star)}
            onMouseEnter={() => !disabled && setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            onKeyDown={(e) => handleKeyDown(e, star)}
            className={cn(
              'rounded p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            )}
          >
            <Star
              className={cn(
                'h-6 w-6 transition-colors',
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-transparent text-gray-300',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export { StarRatingInput };
export type { StarRatingInputProps };
