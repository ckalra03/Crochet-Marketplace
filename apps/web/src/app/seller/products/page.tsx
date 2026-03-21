'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Package } from 'lucide-react';
import api from '@/lib/api/client';
import { toast } from 'sonner';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'info'> = {
  DRAFT: 'secondary',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  DISABLED: 'secondary',
} as any;

export default function SellerProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/seller/products').then(({ data }) => {
      setProducts(data.products);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function submitForApproval(productId: string) {
    try {
      await api.post(`/seller/products/${productId}/submit`);
      toast.success('Submitted for approval');
      const { data } = await api.get('/seller/products');
      setProducts(data.products);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit');
    }
  }

  if (loading) return <div className="py-20 text-center">Loading products...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Products</h1>
        <Link href="/seller/products/new">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No products yet</h2>
          <p className="text-muted-foreground mb-4">Create your first product listing</p>
          <Link href="/seller/products/new"><Button>Add Product</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product: any) => (
            <Card key={product.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center"><Package className="h-6 w-6 text-muted-foreground/30" /></div>
                  <div>
                    <p className="font-semibold text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category?.name} · {product.productType.replace(/_/g, ' ')}</p>
                    <p className="font-bold text-primary-600 text-sm mt-1">
                      {product.priceInCents ? `₹${(product.priceInCents / 100).toLocaleString('en-IN')}` : 'Custom'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusColors[product.status] || 'default'}>{product.status.replace(/_/g, ' ')}</Badge>
                  {(product.status === 'DRAFT' || product.status === 'REJECTED') && (
                    <Button size="sm" variant="outline" onClick={() => submitForApproval(product.id)}>Submit</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
