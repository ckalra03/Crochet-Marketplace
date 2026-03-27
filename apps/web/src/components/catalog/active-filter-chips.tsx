'use client';

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUrlFilters, type FilterKey } from '@/lib/hooks/use-url-filters';

/** Human-readable labels for each sort option. */
const SORT_LABELS: Record<string, string> = {
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  name: 'Name A-Z',
};

/** Human-readable labels for product type values. */
const TYPE_LABELS: Record<string, string> = {
  READY_STOCK: 'Ready Stock',
  MADE_TO_ORDER: 'Made to Order',
  ON_DEMAND: 'On Demand',
};

/**
 * ActiveFilterChips — shows currently active catalog filters as removable badges.
 *
 * Each chip shows the filter label and an X button to remove it.
 * A "Clear all" button appears when any filters are active.
 */
export function ActiveFilterChips() {
  const { filters, hasActiveFilters, removeFilter, clearFilters } = useUrlFilters();

  if (!hasActiveFilters) return null;

  /** Helper to build a chip entry. */
  const chips: { key: FilterKey; label: string }[] = [];

  if (filters.search) {
    chips.push({ key: 'search', label: `Search: "${filters.search}"` });
  }
  if (filters.categoryId) {
    chips.push({ key: 'categoryId', label: `Category: ${filters.categoryId}` });
  }
  if (filters.productType) {
    chips.push({
      key: 'productType',
      label: TYPE_LABELS[filters.productType] || filters.productType,
    });
  }
  if (filters.minPrice) {
    // Prices stored as cents in the URL
    chips.push({ key: 'minPrice', label: `Min: ₹${Number(filters.minPrice) / 100}` });
  }
  if (filters.maxPrice) {
    chips.push({ key: 'maxPrice', label: `Max: ₹${Number(filters.maxPrice) / 100}` });
  }
  if (filters.sort) {
    chips.push({ key: 'sort', label: `Sort: ${SORT_LABELS[filters.sort] || filters.sort}` });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {chips.map(({ key, label }) => (
        <Badge
          key={key}
          variant="secondary"
          className="pl-3 pr-1.5 py-1 flex items-center gap-1 text-sm cursor-pointer hover:bg-secondary/80"
        >
          {label}
          <button
            onClick={() => removeFilter(key)}
            className="ml-1 rounded-full p-0.5 hover:bg-black/10 transition-colors"
            aria-label={`Remove ${label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Clear all button */}
      <button
        onClick={clearFilters}
        className="text-sm text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2"
      >
        Clear all
      </button>
    </div>
  );
}
