'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import api from '@/lib/api/client';
import { toast } from 'sonner';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);

  async function fetchProducts() {
    const { data } = await api.get('/admin/products/pending');
    setProducts(data.products);
  }

  useEffect(() => { fetchProducts(); }, []);

  async function approve(id: string) {
    try {
      await api.post(`/admin/products/${id}/approve`);
      toast.success('Product approved');
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  }

  async function reject(id: string) {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await api.post(`/admin/products/${id}/reject`, { reason });
      toast.success('Product rejected');
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Product Approval Queue</h1>
      {products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">No pending products</h2>
          <p className="text-muted-foreground">All products have been reviewed</p>
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
                    <p className="text-xs text-muted-foreground">
                      by {product.sellerProfile?.businessName} · {product.productType?.replace(/_/g, ' ')} · {product.category?.name}
                    </p>
                    <p className="font-bold text-primary-600 text-sm mt-1">
                      {product.priceInCents ? `₹${(product.priceInCents / 100).toLocaleString('en-IN')}` : 'Custom'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => approve(product.id)}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => reject(product.id)}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
