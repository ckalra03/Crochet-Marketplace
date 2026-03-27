'use client';

/**
 * ShippingInfo -- Displays tracking number, carrier, estimated delivery,
 * and a link to track the shipment on the carrier's website.
 *
 * Only rendered for orders that are DISPATCHED or beyond (DELIVERED, COMPLETED).
 */

import { Truck, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils/format';

/** Statuses for which we show shipping info */
const SHIPPING_VISIBLE_STATUSES = ['DISPATCHED', 'DELIVERED', 'COMPLETED'];

/** Placeholder tracking URLs per carrier (would be real URLs in production) */
const CARRIER_TRACKING_URLS: Record<string, string> = {
  'India Post': 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx',
  'DTDC': 'https://www.dtdc.in/tracking.asp',
  'Blue Dart': 'https://www.bluedart.com/tracking',
  'Delhivery': 'https://www.delhivery.com/track/package/',
  'Ekart': 'https://ekartlogistics.com/track/',
};

interface ShippingInfoProps {
  order: {
    status: string;
    trackingNumber?: string;
    shippingCarrier?: string;
    estimatedDeliveryDate?: string;
  };
}

function ShippingInfo({ order }: ShippingInfoProps) {
  // Only render for dispatched+ orders
  if (!SHIPPING_VISIBLE_STATUSES.includes(order.status)) {
    return null;
  }

  const carrier = order.shippingCarrier || 'Carrier';
  const trackingUrl = CARRIER_TRACKING_URLS[carrier] || '#';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          {/* Carrier */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Carrier</span>
            <span className="font-medium">{carrier}</span>
          </div>

          {/* Tracking number */}
          {order.trackingNumber ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tracking Number</span>
              <span className="font-mono font-medium">{order.trackingNumber}</span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tracking Number</span>
              <span className="text-muted-foreground italic">Pending</span>
            </div>
          )}

          {/* Estimated delivery */}
          {order.estimatedDeliveryDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Delivery</span>
              <span className="font-medium">{formatDate(order.estimatedDeliveryDate)}</span>
            </div>
          )}

          {/* Track link */}
          {order.trackingNumber && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary-600 hover:underline mt-2"
            >
              Track Shipment <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { ShippingInfo };
