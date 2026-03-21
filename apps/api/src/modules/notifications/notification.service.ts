import { emitToUser, emitToSeller, emitToAdmins } from '../../socket/socket';
import { createModuleLogger } from '../../support/logger';

const log = createModuleLogger('notifications');

export type NotificationType =
  | 'order.confirmed'
  | 'order.dispatched'
  | 'order.delivered'
  | 'order.cancelled'
  | 'seller.approved'
  | 'seller.rejected'
  | 'product.approved'
  | 'product.rejected'
  | 'quote.issued'
  | 'quote.accepted'
  | 'return.submitted'
  | 'return.resolved'
  | 'dispute.resolved'
  | 'payout.processed'
  | 'new_order';

interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export class NotificationService {
  // ─── Buyer Notifications ─────────────────────────
  notifyBuyerOrderConfirmed(userId: string, orderNumber: string) {
    this.sendToUser(userId, {
      type: 'order.confirmed',
      title: 'Order Confirmed',
      message: `Your order ${orderNumber} has been confirmed and is being processed.`,
      data: { orderNumber },
    });
  }

  notifyBuyerOrderDispatched(userId: string, orderNumber: string, trackingNumber?: string) {
    this.sendToUser(userId, {
      type: 'order.dispatched',
      title: 'Order Shipped',
      message: `Your order ${orderNumber} has been dispatched.${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`,
      data: { orderNumber, trackingNumber },
    });
  }

  notifyBuyerOrderDelivered(userId: string, orderNumber: string) {
    this.sendToUser(userId, {
      type: 'order.delivered',
      title: 'Order Delivered',
      message: `Your order ${orderNumber} has been delivered. Please rate your experience!`,
      data: { orderNumber },
    });
  }

  notifyBuyerQuoteIssued(userId: string, requestNumber: string, priceDisplay: string) {
    this.sendToUser(userId, {
      type: 'quote.issued',
      title: 'Quote Received',
      message: `A quote of ${priceDisplay} has been issued for your request ${requestNumber}.`,
      data: { requestNumber },
    });
  }

  notifyBuyerReturnResolved(userId: string, returnNumber: string, resolution: string) {
    this.sendToUser(userId, {
      type: 'return.resolved',
      title: 'Return Resolved',
      message: `Your return ${returnNumber} has been resolved: ${resolution}.`,
      data: { returnNumber, resolution },
    });
  }

  // ─── Seller Notifications ────────────────────────
  notifySellerApproved(sellerProfileId: string, userId: string) {
    this.sendToUser(userId, {
      type: 'seller.approved',
      title: 'Application Approved',
      message: 'Your seller application has been approved! You can now list products.',
    });
  }

  notifySellerRejected(userId: string, reason: string) {
    this.sendToUser(userId, {
      type: 'seller.rejected',
      title: 'Application Rejected',
      message: `Your seller application was not approved: ${reason}`,
    });
  }

  notifySellerProductApproved(sellerProfileId: string, productName: string) {
    this.sendToSeller(sellerProfileId, {
      type: 'product.approved',
      title: 'Product Approved',
      message: `Your product "${productName}" has been approved and is now live.`,
      data: { productName },
    });
  }

  notifySellerNewOrder(sellerProfileId: string, orderNumber: string) {
    this.sendToSeller(sellerProfileId, {
      type: 'new_order',
      title: 'New Order',
      message: `You have a new order allocation: ${orderNumber}`,
      data: { orderNumber },
    });
  }

  notifySellerPayoutProcessed(sellerProfileId: string, payoutNumber: string, amountDisplay: string) {
    this.sendToSeller(sellerProfileId, {
      type: 'payout.processed',
      title: 'Payout Processed',
      message: `Payout ${payoutNumber} of ${amountDisplay} has been processed.`,
      data: { payoutNumber },
    });
  }

  // ─── Admin Notifications ────────────────────────
  notifyAdminNewSellerApplication(businessName: string) {
    this.sendToAdmins({
      type: 'seller.approved', // reusing type for admin alert
      title: 'New Seller Application',
      message: `${businessName} has submitted a seller application.`,
      data: { businessName },
    });
  }

  notifyAdminNewDispute(disputeNumber: string) {
    this.sendToAdmins({
      type: 'return.submitted',
      title: 'New Dispute',
      message: `Dispute ${disputeNumber} has been raised and needs review.`,
      data: { disputeNumber },
    });
  }

  // ─── Internal helpers ───────────────────────────
  private sendToUser(userId: string, payload: NotificationPayload) {
    log.info(`Notification [${payload.type}] → user:${userId}: ${payload.message}`);
    emitToUser(userId, 'notification', payload);
  }

  private sendToSeller(sellerProfileId: string, payload: NotificationPayload) {
    log.info(`Notification [${payload.type}] → seller:${sellerProfileId}: ${payload.message}`);
    emitToSeller(sellerProfileId, 'notification', payload);
  }

  private sendToAdmins(payload: NotificationPayload) {
    log.info(`Notification [${payload.type}] → admins: ${payload.message}`);
    emitToAdmins('notification', payload);
  }
}

export const notificationService = new NotificationService();
