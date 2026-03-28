'use client';

/**
 * New Product page -- create mode.
 * Renders the ProductForm component with empty initial state.
 * Includes breadcrumb navigation: Dashboard > Products > New.
 * Uses the useCategories() hook instead of raw fetch for consistency.
 */

import Link from 'next/link';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ProductForm } from '@/components/seller/product-form';
import { useCategories } from '@/lib/hooks/use-catalog';

export default function NewProductPage() {
  // Use the shared hook for fetching categories (cached via React Query)
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  return (
    <div>
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/seller">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/seller/products">Products</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>

      {/* Show loading state while categories are being fetched */}
      {categoriesLoading ? (
        <div className="py-20 text-center">Loading...</div>
      ) : (
        <ProductForm categories={categories} />
      )}
    </div>
  );
}
