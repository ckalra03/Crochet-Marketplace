'use client';

/**
 * Admin Warehouse Item Detail Page -- Full view of a single warehouse item.
 *
 * Shows item info, current status, QC history, and context-sensitive forms:
 * - "Mark Received" button for AWAITING_ARRIVAL
 * - QCChecklistForm for QC_PENDING
 * - DispatchForm for QC_PASSED / PACKED
 */

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/feedback/status-badge';
import { FulfillmentTimeline } from '@/components/admin/fulfillment-timeline';
import { QCChecklistForm } from '@/components/admin/qc-checklist-form';
import { DispatchForm } from '@/components/admin/dispatch-form';
import { useAdminWarehouse, useReceiveWarehouseItem } from '@/lib/hooks/use-admin';
import { formatDate, formatDateTime } from '@/lib/utils/format';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminWarehouseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  // Fetch all warehouse items and find the one we need.
  // Ideally there would be a getWarehouseItem(id) endpoint, but we reuse the list.
  const { data, isLoading, refetch } = useAdminWarehouse();
  const items: any[] = data?.items ?? [];
  const item = items.find((i: any) => i.id === itemId);

  const receiveItem = useReceiveWarehouseItem();

  /** Handle marking the item as received. */
  function handleReceive() {
    receiveItem.mutate(itemId, {
      onSuccess: () => {
        toast.success('Item marked as received');
        refetch();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || 'Failed to receive item');
      },
    });
  }

  if (isLoading) {
    return <p className="text-center py-10 text-muted-foreground">Loading...</p>;
  }

  if (!item) {
    return (
      <div className="text-center py-10 space-y-4">
        <p className="text-muted-foreground">Warehouse item not found.</p>
        <Button variant="ghost" onClick={() => router.push('/admin/warehouse')}>
          Back to Warehouse
        </Button>
      </div>
    );
  }

  // Build timestamps from item history if available
  const timestamps: Record<string, string> = {};
  if (item.statusHistory) {
    for (const entry of item.statusHistory) {
      timestamps[entry.status] = entry.createdAt;
    }
  }
  if (item.receivedAt) timestamps['RECEIVED'] = item.receivedAt;

  return (
    <div className="space-y-6">
      {/* Breadcrumb / back nav */}
      <Button variant="ghost" size="sm" onClick={() => router.push('/admin/warehouse')}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Warehouse
      </Button>

      {/* Item header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {item.orderItem?.product?.name ?? 'Warehouse Item'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Order: {item.orderItem?.order?.orderNumber ?? 'N/A'}
          </p>
          <p className="text-sm text-muted-foreground">
            Seller: {item.sellerProfile?.businessName ?? 'N/A'}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      {/* Fulfillment timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fulfillment Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <FulfillmentTimeline currentStatus={item.status} timestamps={timestamps} />
        </CardContent>
      </Card>

      {/* Item details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Product:</span>{' '}
              {item.orderItem?.product?.name ?? 'N/A'}
            </p>
            <p>
              <span className="text-muted-foreground">Quantity:</span>{' '}
              {item.orderItem?.quantity ?? 1}
            </p>
            <p>
              <span className="text-muted-foreground">Created:</span>{' '}
              {formatDateTime(item.createdAt)}
            </p>
            {item.receivedAt && (
              <p>
                <span className="text-muted-foreground">Received:</span>{' '}
                {formatDateTime(item.receivedAt)}
              </p>
            )}
            {item.trackingNumber && (
              <p>
                <span className="text-muted-foreground">Tracking:</span>{' '}
                <span className="font-mono">{item.trackingNumber}</span>{' '}
                ({item.shippingCarrier ?? 'Unknown carrier'})
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QC history (past QC records) */}
      {item.qcRecords && item.qcRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">QC History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {item.qcRecords.map((qc: any, i: number) => (
                <div key={qc.id ?? i} className="border rounded p-3 text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={qc.result === 'PASS' ? 'QC_PASSED' : 'QC_FAILED'} />
                    <span className="text-xs text-muted-foreground">
                      {qc.createdAt ? formatDateTime(qc.createdAt) : ''}
                    </span>
                  </div>
                  {qc.defectNotes && (
                    <p className="text-muted-foreground">Notes: {qc.defectNotes}</p>
                  )}
                  {qc.checklist && (
                    <div className="flex gap-2 flex-wrap text-xs">
                      {Object.entries(qc.checklist).map(([key, val]) => (
                        <span
                          key={key}
                          className={`px-2 py-0.5 rounded ${
                            val
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Context-sensitive action forms */}
      {item.status === 'AWAITING_ARRIVAL' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mark as Received</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Confirm that this item has arrived at the warehouse.
            </p>
            <Button onClick={handleReceive} disabled={receiveItem.isPending}>
              {receiveItem.isPending ? 'Marking...' : 'Mark Received'}
            </Button>
          </CardContent>
        </Card>
      )}

      {item.status === 'QC_PENDING' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quality Check</CardTitle>
          </CardHeader>
          <CardContent>
            <QCChecklistForm warehouseItemId={itemId} onSuccess={() => refetch()} />
          </CardContent>
        </Card>
      )}

      {(item.status === 'QC_PASSED' || item.status === 'PACKED') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dispatch</CardTitle>
          </CardHeader>
          <CardContent>
            <DispatchForm warehouseItemId={itemId} onSuccess={() => refetch()} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
