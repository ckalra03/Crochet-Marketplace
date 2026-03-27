'use client';

/**
 * Admin Products Page -- Tabbed view for pending approval and all products.
 * Uses DataTable for both tabs with sortable columns and inline actions.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, DataTableColumnHeader } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/feedback/status-badge';
import { ProductReviewPanel } from '@/components/admin/product-review-panel';
import { useAdminPendingProducts, useAdminProducts } from '@/lib/hooks/use-admin';
import { formatMoney, formatDate } from '@/lib/utils/format';
import { Skeleton } from '@/components/ui/skeleton';

/* ─────────────── Types ─────────────── */

interface Product {
  id: string;
  name: string;
  productType: string;
  priceInCents: number | null;
  status: string;
  createdAt: string;
  sellerProfile?: {
    businessName: string;
  };
  category?: {
    name: string;
  };
}

/* ─────────────── Pending Tab Columns ─────────────── */

function usePendingColumns(): ColumnDef<Product, any>[] {
  return useMemo(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Product Name" />,
        cell: ({ row }) => (
          <Link
            href={`/admin/products/${row.original.id}`}
            className="font-medium text-primary hover:underline"
          >
            {row.getValue('name')}
          </Link>
        ),
      },
      {
        accessorKey: 'sellerProfile.businessName',
        id: 'seller',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Seller" />,
        cell: ({ row }) => row.original.sellerProfile?.businessName || '-',
      },
      {
        accessorKey: 'productType',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => (
          <StatusBadge status={row.getValue('productType') as string} />
        ),
      },
      {
        accessorKey: 'priceInCents',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
        cell: ({ row }) => {
          const cents = row.getValue('priceInCents') as number | null;
          return cents ? formatMoney(cents) : 'Custom';
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Submitted" />,
        cell: ({ row }) => formatDate(row.getValue('createdAt') as string),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <ProductReviewPanel
            productId={row.original.id}
            productName={row.original.name}
          />
        ),
      },
    ],
    [],
  );
}

/* ─────────────── All Products Tab Columns ─────────────── */

function useAllColumns(): ColumnDef<Product, any>[] {
  return useMemo(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Product Name" />,
        cell: ({ row }) => (
          <Link
            href={`/admin/products/${row.original.id}`}
            className="font-medium text-primary hover:underline"
          >
            {row.getValue('name')}
          </Link>
        ),
      },
      {
        accessorKey: 'sellerProfile.businessName',
        id: 'seller',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Seller" />,
        cell: ({ row }) => row.original.sellerProfile?.businessName || '-',
      },
      {
        accessorKey: 'productType',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => (
          <StatusBadge status={row.getValue('productType') as string} />
        ),
      },
      {
        accessorKey: 'priceInCents',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
        cell: ({ row }) => {
          const cents = row.getValue('priceInCents') as number | null;
          return cents ? formatMoney(cents) : 'Custom';
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
          <StatusBadge status={row.getValue('status') as string} type="product" />
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
        cell: ({ row }) => formatDate(row.getValue('createdAt') as string),
      },
    ],
    [],
  );
}

/* ─────────────── Loading Skeleton ─────────────── */

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/* ─────────────── Page Component ─────────────── */

export default function AdminProductsPage() {
  const pendingQuery = useAdminPendingProducts();
  const allQuery = useAdminProducts();

  const pendingColumns = usePendingColumns();
  const allColumns = useAllColumns();

  const pendingProducts: Product[] = pendingQuery.data?.products ?? [];
  const allProducts: Product[] = allQuery.data?.products ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Product Management</h1>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Approval{pendingProducts.length > 0 && ` (${pendingProducts.length})`}
          </TabsTrigger>
          <TabsTrigger value="all">All Products</TabsTrigger>
        </TabsList>

        {/* Pending Approval Tab */}
        <TabsContent value="pending">
          {pendingQuery.isLoading ? (
            <TableSkeleton />
          ) : pendingProducts.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold">No pending products</h2>
              <p className="text-muted-foreground">All products have been reviewed</p>
            </div>
          ) : (
            <DataTable
              columns={pendingColumns}
              data={pendingProducts}
              searchPlaceholder="Search pending products..."
              searchColumn="name"
            />
          )}
        </TabsContent>

        {/* All Products Tab */}
        <TabsContent value="all">
          {allQuery.isLoading ? (
            <TableSkeleton />
          ) : (
            <DataTable
              columns={allColumns}
              data={allProducts}
              searchPlaceholder="Search all products..."
              searchColumn="name"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
