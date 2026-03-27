import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

/**
 * E2E tests for the Returns & Ratings buyer flow.
 *
 * These tests hit the backend API directly to verify:
 * - Submit return (valid + invalid reasons)
 * - List returns
 * - Return detail
 * - Submit rating (valid 1-5 score)
 * - Duplicate rating rejection
 *
 * NOTE: Tests assume a seeded database with at least one delivered order
 * and valid auth cookies/tokens. Adjust headers as needed for your environment.
 */

// Helper: create auth headers for a test buyer account.
// In a real test environment this would log in and capture a session token.
async function getBuyerHeaders(request: any) {
  const loginRes = await request.post(`${API}/auth/login`, {
    data: { email: 'buyer@test.com', password: 'buyer123456' },
  });
  const body = await loginRes.json();
  return { Authorization: `Bearer ${body.accessToken}` };
}

// ──────────────────────────────────────────────────────────
// Returns API tests
// ──────────────────────────────────────────────────────────

test.describe('Returns API', () => {
  test('submits a valid return request', async ({ request }) => {
    const headers = await getBuyerHeaders(request);

    // First, get orders to find a delivered order item
    const ordersRes = await request.get(`${API}/orders`, { headers });
    const ordersBody = await ordersRes.json();
    const orders = ordersBody.orders ?? ordersBody;

    // Find a delivered order with items
    const deliveredOrder = orders.find(
      (o: any) => o.status === 'DELIVERED' || o.status === 'COMPLETED',
    );

    // Skip if no delivered order exists (test environment may not be seeded)
    if (!deliveredOrder || !deliveredOrder.items?.length) {
      test.skip();
      return;
    }

    const orderItem = deliveredOrder.items[0];

    const res = await request.post(`${API}/returns`, {
      headers,
      data: {
        orderItemId: orderItem.id,
        reason: 'DEFECTIVE',
        description: 'Product arrived with a broken stitch pattern.',
      },
    });

    // Expect 201 Created or 200 OK
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.returnNumber).toBeDefined();
    expect(body.status).toBe('REQUESTED');
  });

  test('rejects return with invalid reason', async ({ request }) => {
    const headers = await getBuyerHeaders(request);

    const res = await request.post(`${API}/returns`, {
      headers,
      data: {
        orderItemId: 'some-item-id',
        reason: 'INVALID_REASON',
        description: 'Testing invalid reason',
      },
    });

    // Expect validation error (400 or 422)
    expect([400, 422]).toContain(res.status());
  });

  test('lists returns for the authenticated buyer', async ({ request }) => {
    const headers = await getBuyerHeaders(request);

    const res = await request.get(`${API}/returns`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    const returns = Array.isArray(body) ? body : body.returns;
    expect(returns).toBeInstanceOf(Array);
  });

  test('fetches return detail by return number', async ({ request }) => {
    const headers = await getBuyerHeaders(request);

    // List returns first to get a valid return number
    const listRes = await request.get(`${API}/returns`, { headers });
    const listBody = await listRes.json();
    const returns = Array.isArray(listBody) ? listBody : listBody.returns;

    if (!returns || returns.length === 0) {
      test.skip();
      return;
    }

    const returnNumber = returns[0].returnNumber;
    const detailRes = await request.get(`${API}/returns/${returnNumber}`, { headers });
    expect(detailRes.status()).toBe(200);

    const detail = await detailRes.json();
    expect(detail.returnNumber).toBe(returnNumber);
    expect(detail.status).toBeDefined();
    expect(detail.reason).toBeDefined();
  });
});

// ──────────────────────────────────────────────────────────
// Ratings API tests
// ──────────────────────────────────────────────────────────

test.describe('Ratings API', () => {
  test('submits a valid rating (score 1-5)', async ({ request }) => {
    const headers = await getBuyerHeaders(request);

    // Get a delivered order to rate
    const ordersRes = await request.get(`${API}/orders`, { headers });
    const ordersBody = await ordersRes.json();
    const orders = ordersBody.orders ?? ordersBody;

    const deliveredOrder = orders.find(
      (o: any) => o.status === 'DELIVERED' || o.status === 'COMPLETED',
    );

    if (!deliveredOrder || !deliveredOrder.items?.length) {
      test.skip();
      return;
    }

    // Find an unrated item
    const unratedItem = deliveredOrder.items.find((item: any) => !item.rating);
    if (!unratedItem) {
      test.skip();
      return;
    }

    const res = await request.post(
      `${API}/orders/${deliveredOrder.orderNumber}/items/${unratedItem.id}/rating`,
      {
        headers,
        data: { score: 4, review: 'Beautiful crochet work, very detailed!' },
      },
    );

    expect([200, 201]).toContain(res.status());
  });

  test('rejects duplicate rating for the same item', async ({ request }) => {
    const headers = await getBuyerHeaders(request);

    // Get a delivered order
    const ordersRes = await request.get(`${API}/orders`, { headers });
    const ordersBody = await ordersRes.json();
    const orders = ordersBody.orders ?? ordersBody;

    const deliveredOrder = orders.find(
      (o: any) => o.status === 'DELIVERED' || o.status === 'COMPLETED',
    );

    if (!deliveredOrder || !deliveredOrder.items?.length) {
      test.skip();
      return;
    }

    // Find an already-rated item
    const ratedItem = deliveredOrder.items.find((item: any) => item.rating);
    if (!ratedItem) {
      // If no rated item, rate one first then try again
      const firstItem = deliveredOrder.items[0];
      await request.post(
        `${API}/orders/${deliveredOrder.orderNumber}/items/${firstItem.id}/rating`,
        { headers, data: { score: 5, review: 'First rating' } },
      );

      // Now try to rate the same item again
      const dupRes = await request.post(
        `${API}/orders/${deliveredOrder.orderNumber}/items/${firstItem.id}/rating`,
        { headers, data: { score: 3, review: 'Duplicate rating attempt' } },
      );

      // Expect conflict or bad request
      expect([400, 409]).toContain(dupRes.status());
      return;
    }

    // Try to rate the already-rated item again
    const res = await request.post(
      `${API}/orders/${deliveredOrder.orderNumber}/items/${ratedItem.id}/rating`,
      { headers, data: { score: 2, review: 'Trying to rate again' } },
    );

    expect([400, 409]).toContain(res.status());
  });
});
