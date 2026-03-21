'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api/client';
import { toast } from 'sonner';

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  async function fetchSellers() {
    const params = filter ? `?status=${filter}` : '';
    const { data } = await api.get(`/admin/sellers${params}`);
    setSellers(data.sellers);
  }

  useEffect(() => { fetchSellers(); }, [filter]);

  async function approve(id: string) {
    try {
      await api.post(`/admin/sellers/${id}/approve`);
      toast.success('Seller approved');
      fetchSellers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  }

  async function reject(id: string) {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await api.post(`/admin/sellers/${id}/reject`, { reason });
      toast.success('Seller rejected');
      fetchSellers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  }

  const statusVariant: Record<string, any> = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'destructive', SUSPENDED: 'destructive' };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Seller Applications</h1>
      <div className="flex gap-2 mb-6">
        {['', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((s) => (
          <Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm" onClick={() => setFilter(s)}>
            {s || 'All'}
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        {sellers.map((seller: any) => (
          <Card key={seller.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{seller.businessName}</p>
                <p className="text-sm text-muted-foreground">{seller.user?.name} · {seller.user?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">Applied: {new Date(seller.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant[seller.status] || 'default'}>{seller.status}</Badge>
                {seller.status === 'PENDING' && (
                  <>
                    <Button size="sm" onClick={() => approve(seller.id)}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => reject(seller.id)}>Reject</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {sellers.length === 0 && <p className="text-center py-10 text-muted-foreground">No sellers found</p>}
      </div>
    </div>
  );
}
