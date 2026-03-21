'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api/client';
import { toast } from 'sonner';

export default function AdminWarehousePage() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [trackingData, setTrackingData] = useState<Record<string, { trackingNumber: string; shippingCarrier: string }>>({});

  async function fetchItems() {
    const params = filter ? `?status=${filter}` : '';
    const { data } = await api.get(`/admin/warehouse${params}`);
    setItems(data.items);
  }

  useEffect(() => { fetchItems(); }, [filter]);

  async function receive(id: string) {
    try { await api.post(`/admin/warehouse/${id}/receive`); toast.success('Item received'); fetchItems(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  }

  async function qcPass(id: string) {
    try {
      await api.post(`/admin/warehouse/${id}/qc`, {
        result: 'PASS',
        checklist: { looseEnds: true, finishingConsistency: true, correctDimensions: true, colorMatch: true, stitchQuality: true, packagingAdequate: true },
      });
      toast.success('QC Passed'); fetchItems();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  }

  async function qcFail(id: string) {
    const notes = prompt('Defect notes:');
    try {
      await api.post(`/admin/warehouse/${id}/qc`, {
        result: 'FAIL',
        checklist: { looseEnds: false, finishingConsistency: false, correctDimensions: true, colorMatch: true, stitchQuality: false, packagingAdequate: true },
        defectNotes: notes || 'Quality issues found',
      });
      toast.success('QC Failed — seller notified'); fetchItems();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  }

  async function dispatch(id: string) {
    const td = trackingData[id];
    if (!td?.trackingNumber || !td?.shippingCarrier) { toast.error('Enter tracking details'); return; }
    try {
      await api.post(`/admin/warehouse/${id}/dispatch`, td);
      toast.success('Item dispatched'); fetchItems();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  }

  const statusColors: Record<string, any> = {
    AWAITING_ARRIVAL: 'warning', QC_PENDING: 'info', QC_PASSED: 'success',
    QC_FAILED: 'destructive', DISPATCHED: 'success', PACKED: 'info',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Warehouse / QC Dashboard</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'AWAITING_ARRIVAL', 'QC_PENDING', 'QC_PASSED', 'QC_FAILED', 'DISPATCHED'].map((s) => (
          <Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm" onClick={() => setFilter(s)}>
            {s?.replace(/_/g, ' ') || 'All'}
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        {items.map((item: any) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{item.orderItem?.product?.name}</p>
                  <p className="text-xs text-muted-foreground">Order: {item.orderItem?.order?.orderNumber} · Seller: {item.sellerProfile?.businessName}</p>
                </div>
                <Badge variant={statusColors[item.status] || 'default'}>{item.status.replace(/_/g, ' ')}</Badge>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {item.status === 'AWAITING_ARRIVAL' && <Button size="sm" onClick={() => receive(item.id)}>Mark Received</Button>}
                {item.status === 'QC_PENDING' && (
                  <>
                    <Button size="sm" onClick={() => qcPass(item.id)}>QC Pass</Button>
                    <Button size="sm" variant="destructive" onClick={() => qcFail(item.id)}>QC Fail</Button>
                  </>
                )}
                {item.status === 'QC_PASSED' && (
                  <div className="flex gap-2 items-center w-full">
                    <Input placeholder="Tracking #" className="w-40" value={trackingData[item.id]?.trackingNumber || ''}
                      onChange={(e) => setTrackingData({ ...trackingData, [item.id]: { ...trackingData[item.id], trackingNumber: e.target.value, shippingCarrier: trackingData[item.id]?.shippingCarrier || '' } })} />
                    <Input placeholder="Carrier" className="w-32" value={trackingData[item.id]?.shippingCarrier || ''}
                      onChange={(e) => setTrackingData({ ...trackingData, [item.id]: { ...trackingData[item.id], shippingCarrier: e.target.value, trackingNumber: trackingData[item.id]?.trackingNumber || '' } })} />
                    <Button size="sm" onClick={() => dispatch(item.id)}>Dispatch</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <p className="text-center py-10 text-muted-foreground">No warehouse items found</p>}
      </div>
    </div>
  );
}
