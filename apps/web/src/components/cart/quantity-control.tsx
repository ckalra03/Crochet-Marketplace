'use client';

import { useState, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuantityControlProps {
  /** Current quantity value */
  quantity: number;
  /** Maximum allowed quantity (defaults to 99) */
  max?: number;
  /** Called when the user changes the quantity */
  onChange: (newQuantity: number) => void;
  /** Disable the controls (e.g. while an update is in-flight) */
  disabled?: boolean;
}

/**
 * Compact +/- quantity control with min 1 and configurable max.
 * Calls onChange immediately on button click.
 */
export function QuantityControl({
  quantity,
  max = 99,
  onChange,
  disabled = false,
}: QuantityControlProps) {
  const handleDecrement = useCallback(() => {
    if (quantity > 1) onChange(quantity - 1);
  }, [quantity, onChange]);

  const handleIncrement = useCallback(() => {
    if (quantity < max) onChange(quantity + 1);
  }, [quantity, max, onChange]);

  return (
    <div className="flex items-center border rounded-md">
      {/* Decrement button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-none rounded-l-md"
        onClick={handleDecrement}
        disabled={disabled || quantity <= 1}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3 w-3" />
      </Button>

      {/* Quantity display */}
      <span className="px-3 text-sm font-medium min-w-[2rem] text-center select-none">
        {quantity}
      </span>

      {/* Increment button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-none rounded-r-md"
        onClick={handleIncrement}
        disabled={disabled || quantity >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
