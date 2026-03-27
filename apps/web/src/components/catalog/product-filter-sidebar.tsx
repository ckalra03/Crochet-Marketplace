'use client';

import { useState, useCallback } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCategories } from '@/lib/hooks/use-catalog';
import { useUrlFilters, type FilterKey } from '@/lib/hooks/use-url-filters';

/** Product type options for the filter. */
const PRODUCT_TYPES = [
  { value: 'READY_STOCK', label: 'Ready Stock' },
  { value: 'MADE_TO_ORDER', label: 'Made to Order' },
  { value: 'ON_DEMAND', label: 'On Demand' },
] as const;

/** Sort options for the dropdown. */
const SORT_OPTIONS = [
  { value: '', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A-Z' },
] as const;

/**
 * Shared filter form content — rendered inside both the desktop
 * sidebar and the mobile Sheet slide-out.
 */
function FilterContent() {
  const { filters, setFilter, removeFilter, clearFilters, hasActiveFilters } =
    useUrlFilters();
  const { data: categories = [] } = useCategories();

  // Local state for price inputs so we don't update the URL on every keystroke.
  // Prices in URL are stored as cents; displayed as rupees.
  const [minPriceInput, setMinPriceInput] = useState(
    filters.minPrice ? String(Number(filters.minPrice) / 100) : '',
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    filters.maxPrice ? String(Number(filters.maxPrice) / 100) : '',
  );

  /** Apply the price range when the user finishes typing. */
  const applyPriceRange = useCallback(() => {
    const minCents = minPriceInput ? String(Number(minPriceInput) * 100) : '';
    const maxCents = maxPriceInput ? String(Number(maxPriceInput) * 100) : '';
    setFilter('minPrice', minCents);
    // Small timeout so the first setFilter URL push finishes
    setTimeout(() => setFilter('maxPrice', maxCents), 50);
  }, [minPriceInput, maxPriceInput, setFilter]);

  return (
    <div className="space-y-6">
      {/* ---------- Search ---------- */}
      <div>
        <h3 className="font-bold text-sm text-[#1c1b1b] mb-3 uppercase tracking-wider">
          Search
        </h3>
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="w-full border border-[#e7e5e4] rounded-lg px-4 py-2.5 text-sm bg-[#fcf9f8] focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 outline-none transition-all"
        />
      </div>

      {/* ---------- Category filter (checkboxes) ---------- */}
      <div>
        <h3 className="font-bold text-sm text-[#1c1b1b] mb-3 uppercase tracking-wider">
          Category
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map((cat: { id: string; name: string }) => (
            <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={filters.categoryId === cat.id}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFilter('categoryId', cat.id);
                  } else {
                    removeFilter('categoryId');
                  }
                }}
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>

      {/* ---------- Product type filter (checkboxes) ---------- */}
      <div>
        <h3 className="font-bold text-sm text-[#1c1b1b] mb-3 uppercase tracking-wider">
          Product Type
        </h3>
        <div className="space-y-2">
          {PRODUCT_TYPES.map((type) => (
            <label key={type.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={filters.productType === type.value}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFilter('productType', type.value);
                  } else {
                    removeFilter('productType');
                  }
                }}
              />
              {type.label}
            </label>
          ))}
        </div>
      </div>

      {/* ---------- Price range ---------- */}
      <div>
        <h3 className="font-bold text-sm text-[#1c1b1b] mb-3 uppercase tracking-wider">
          Price Range (INR)
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            onBlur={applyPriceRange}
            onKeyDown={(e) => e.key === 'Enter' && applyPriceRange()}
            className="w-full border border-[#e7e5e4] rounded-lg px-3 py-2 text-sm bg-[#fcf9f8] focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 outline-none"
          />
          <span className="text-[#78716c] text-sm">-</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            onBlur={applyPriceRange}
            onKeyDown={(e) => e.key === 'Enter' && applyPriceRange()}
            className="w-full border border-[#e7e5e4] rounded-lg px-3 py-2 text-sm bg-[#fcf9f8] focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 outline-none"
          />
        </div>
      </div>

      {/* ---------- Sort dropdown ---------- */}
      <div>
        <h3 className="font-bold text-sm text-[#1c1b1b] mb-3 uppercase tracking-wider">
          Sort By
        </h3>
        <select
          value={filters.sort}
          onChange={(e) => setFilter('sort', e.target.value)}
          className="w-full border border-[#e7e5e4] rounded-lg px-4 py-2.5 text-sm bg-[#fcf9f8] focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* ---------- Clear all ---------- */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full py-2.5 rounded-lg border border-[#e7e5e4] text-sm font-medium text-[#78716c] hover:bg-[#f0eded] transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}

/**
 * ProductFilterSidebar — responsive filter panel.
 *
 * - Desktop (lg+): renders as a sticky sidebar column.
 * - Mobile (<lg): renders a "Filters" button that opens a Sheet slide-out.
 */
export function ProductFilterSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ===== Mobile: Sheet trigger button ===== */}
      <div className="lg:hidden mb-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e7e5e4] rounded-lg text-sm font-medium hover:bg-[#f0eded] transition-colors">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ===== Desktop: sticky sidebar ===== */}
      <aside className="hidden lg:block">
        <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
          <FilterContent />
        </div>
      </aside>
    </>
  );
}
