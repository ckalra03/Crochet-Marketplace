'use client';

/**
 * Seller Products list page.
 *
 * Uses DataTable with sortable columns: Name, Type, Status, Price, Stock, Actions.
 * Search filtering by product name. Action buttons for Edit, Submit for Approval, Delete.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Send, Package, Eye } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumnHeader } from '@/components/data-table/data-table';
import { StatusBadge } from '@/components/feedback/status-badge';
import { useSellerProducts, useSubmitForApproval, useDeleteProduct } from '@/lib/hooks/use-seller';
import { formatMoney } from '@/lib/utils/format';

/** Product type as returned by the seller API */
interface SellerProduct {
  id: string;
  name: string;
  productType: string;
  status: string;
  priceInCents: number | null;
  stockQuantity: number | null;
  category?: { name: string };
}

/** Badge variant map for product types */
const typeBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  READY_STOCK: 'default',
  MADE_TO_ORDER: 'secondary',
  ON_DEMAND: 'outline',
};

export default function SellerProductsPage() {
  const router = useRouter();
  const { data, isLoading } = useSellerProducts();
  const submitForApproval = useSubmitForApproval();
  const deleteProduct = useDeleteProduct();

  const products: SellerProduct[] = data?.products ?? [];

  /** Handle submitting a product for approval */
  async function handleSubmit(id: string) {
    try {
      await submitForApproval.mutateAsync(id);
      toast.success('Submitted for approval');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit');
    }
  }

  /** Handle deleting a product */
  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success('Product deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  }

  /** Column definitions for the DataTable */
  const columns = useMemo<ColumnDef<SellerProduct, any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            {row.original.category?.name && (
              <p className="text-xs text-muted-foreground">{row.original.category.name}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'productType',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => (
          <Badge variant={typeBadgeVariant[row.original.productType] || 'default'}>
            {row.original.productType.replace(/_/g, ' ')}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge status={row.original.status} type="product" />,
      },
      {
        accessorKey: 'priceInCents',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
        cell: ({ row }) =>
          row.original.priceInCents ? formatMoney(row.original.priceInCents) : 'Custom',
      },
      {
        accessorKey: 'stockQuantity',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Stock" />,
        cell: ({ row }) =>
          row.original.productType === 'READY_STOCK'
            ? (row.original.stockQuantity ?? 0)
            : '-',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex items-center gap-1">
              {/* Edit button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push(`/seller/products/${product.id}/edit`)}
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>

              {/* Preview button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push(`/seller/products/${product.id}/preview`)}
                title="Preview"
              >
                <Eye className="h-4 w-4" />
              </Button>

              {/* Submit for approval -- only for DRAFT or REJECTED */}
              {(product.status === 'DRAFT' || product.status === 'REJECTED') && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSubmit(product.id)}
                  disabled={submitForApproval.isPending}
                  title="Submit for Approval"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}

              {/* Delete button */}
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={() => handleDelete(product.id, product.name)}
                disabled={deleteProduct.isPending}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [router, submitForApproval.isPending, deleteProduct.isPending],
  );

  if (isLoading) {
    return <div className="py-20 text-center">Loading products...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Products</h1>
        <Link href="/seller/products/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create Product
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No products yet</h2>
          <p className="text-muted-foreground mb-4">Create your first product listing</p>
          <Link href="/seller/products/new">
            <Button>Create Product</Button>
          </Link>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={products}
          searchPlaceholder="Search products..."
          searchColumn="name"
        />
      )}
    </div>
  );
}
