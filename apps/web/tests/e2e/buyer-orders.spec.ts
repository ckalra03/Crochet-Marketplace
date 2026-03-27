import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

/**
 * E2E tests for the Buyer Orders API endpoints.
 *
 * These tests verify the order list, order detail, and cancel order
 * endpoints return the expected data and enforce business rules.
 *
 * NOTE: Tests assume a seeded database with at least one buyer order.
 */

// Helper: log in as buyer and return auth headers
async function getBuyerHeaders(request: any) {
  const loginRes = await request.post(`${API}/auth/login`, {
    data: { email: 'buyer@test.com', password: 'buyer123456' },
  });
  const body = await loginRes.json();
  return { Authorization: `Bearer ${body.accessToken}` };
}

test.describe('Buyer Orders API', () => {
  // ------------------------------------------------------------------
  // Orders list
  // ------------------------------------------------------------------
  test('orders list API returns data with expected shape', async ({ request }) => {
    const headers = await getBuyerHeaders(request);
    const res = await request.get(`${API}/orders`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.orders).toBeInstanceOf(Array);

    // If orders exist, verify basic shape
    if (body.orders.length > 0) {
      const order = body.orders[0];
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('orderNumber');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('totalInCents');
      expect(typeof order.totalInCents).toBe('number');
    }
  });

  test('orders list API supports status filter param', async ({ request }) => {
    const headers = await getBuyerHeaders(request);
    const res = await request.get(`${API}/orders?status=CONFIRMED`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.orders).toBeInstanceOf(Array);

    // Every returned order must match the requested status
    for (const order of body.orders) {
      expect(order.status).toBe('CONFIRMED');
    }
  });

  // ------------------------------------------------------------------
  // Order detail
  // ------------------------------------------------------------------
  test('order detail API returns full order with items', async ({ request }) => {
    const headers = await getBuyerHeaders(request);

    // First get the list to find a valid order number
    const listRes = await request.get(`${API}/orders`, { headers });
    const listBody = await listRes.json();

    // Skip if no orders in the database
    if (listBody.orders.length === 0) {
      test.skip();
      return;
    }

    const orderNumber = listBody.orders[0].orderNumber;
    const res = await request.get(`${API}/orders/${orderNumber}`, { headers });
    expect(res.status()).toBe(200);

    const order = await res.json();
    expect(order.orderNumber).toBe(orderNumber);
    expect(order).toHaveProperty('status');
    expect(order).toHaveProperty('totalInCents');
    expect(order).toHaveProperty('subtotalInCents');
    expect(order).toHaveProperty('items');
    expect(order.items).toBeInstanceOf(Array);

    // Each item should have core fields
    if (order.items.length > 0) {
      const item = order.items[0];
      expect(item).toHaveProperty('productName');
      expect(item).toHaveProperty('quantity');
      expect(item).toHaveProperty('totalPriceInCents');
    }
  });

  test('order detail API returns 404 for non-existent order', async ({ request }) => {
    const headers = await getBuyerHeaders(request);
    const res = await request.get(`${API}/orders/ORD-DOES-NOT-EXIST-999`, { headers });
    expect(res.status()).toBe(404);
  });

  // ------------------------------------------------------------------
  // Cancel order
  // ------------------------------------------------------------------
  test('cancel order API works for cancellable orders', async ({ request }) => {
    const headers = await getBuyerHeaders(request);

    // Find a cancellable order (CONFIRMED or PROCESSING)
    const listRes = await request.get(`${API}/orders`, { headers });
    const listBody = await listRes.json();

    const cancellable = listBody.orders.find(
      (o: any) => ['CONFIRMED', 'PROCESSING'].includes(o.status),
    );

    if (!cancellable) {
      test.skip();
      return;
    }

    const res = await request.post(`${API}/orders/${cancellable.orderNumber}/cancel`, {
      headers,
      data: { reason: 'E2E test cancellation' },
    });

    // Should succeed (200 or 201)
    expect([200, 201]).toContain(res.status());

    const body = await res.json();
    // After cancellation, status should be CANCELLED
    expect(body.status).toBe('CANCELLED');
  });

  test('cancel order API rejects for non-cancellable orders', async ({ request }) => {
    const headers = await getBuyerHeaders(request);

    // Find a non-cancellable order (DELIVERED, COMPLETED, CANCELLED, etc.)
    const listRes = await request.get(`${API}/orders`, { headers });
    const listBody = await listRes.json();

    const nonCancellable = listBody.orders.find(
      (o: any) => ['DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPATCHED'].includes(o.status),
    );

    if (!nonCancellable) {
      test.skip();
      return;
    }

    const res = await request.post(`${API}/orders/${nonCancellable.orderNumber}/cancel`, {
      headers,
      data: { reason: 'E2E test — should be rejected' },
    });

    // Should be rejected with 400 or 409
    expect([400, 409, 422]).toContain(res.status());
  });
});
