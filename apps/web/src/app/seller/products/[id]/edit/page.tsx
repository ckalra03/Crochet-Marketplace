'use client';

/**
 * Edit Product page -- pre-populates the ProductForm with existing product data.
 * Fetches the product via the seller API using the [id] route param.
 * Breadcrumb: Dashboard > Products > Edit.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
import { useSellerProduct } from '@/lib/hooks/use-seller';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  // Fetch the product to pre-populate the form
  const { data: product, isLoading: productLoading } = useSellerProduct(productId);

  // Fetch categories for the dropdown
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetch(`${API_URL}/catalog/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  if (productLoading) {
    return <div className="py-20 text-center">Loading product...</div>;
  }

  if (!product) {
    return <div className="py-20 text-center text-muted-foreground">Product not found.</div>;
  }

  // Map the API response to the initialData shape expected by ProductForm
  const initialData = {
    id: product.id,
    name: product.name ?? '',
    description: product.description ?? '',
    categoryId: product.categoryId ?? '',
    productType: product.productType ?? 'READY_STOCK',
    priceInCents: product.priceInCents ?? undefined,
    compareAtPriceInCents: product.compareAtPriceInCents ?? undefined,
    stockQuantity: product.stockQuantity ?? 0,
    leadTimeDays: product.leadTimeDays ?? undefined,
    returnPolicy: product.returnPolicy ?? 'DEFECT_ONLY',
    materials: product.materials ?? '',
    dimensions: product.dimensions ?? '',
    careInstructions: product.careInstructions ?? '',
  };

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
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>

      <ProductForm initialData={initialData} categories={categories} />
    </div>
  );
}
