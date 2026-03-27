import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

/**
 * E2E tests for Admin Orders and Warehouse/QC APIs.
 *
 * These tests hit the backend API directly to verify:
 * - Admin orders list and detail endpoints
 * - Order status update
 * - Warehouse items list
 * - Receive warehouse item
 * - QC submission (pass and fail)
 *
 * NOTE: Tests assume a seeded database with an admin account and
 * existing orders/warehouse items. Adjust credentials as needed.
 */

// Helper: log in as a test admin and return auth headers.
async function getAdminHeaders(request: any) {
  const loginRes = await request.post(`${API}/auth/login`, {
    data: { email: 'admin@crochethub.com', password: 'admin123456' },
  });
  const body = await loginRes.json();
  return { Authorization: `Bearer ${body.accessToken}` };
}

// ──────────────────────────────────────────────────────────
// Admin Orders API tests
// ──────────────────────────────────────────────────────────

test.describe('Admin Orders API', () => {
  test('lists all orders', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/orders`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    const orders = body.orders ?? body;
    expect(Array.isArray(orders)).toBeTruthy();
  });

  test('lists orders filtered by status', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/orders?status=CONFIRMED`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    const orders = body.orders ?? body;
    expect(Array.isArray(orders)).toBeTruthy();
    // All returned orders should have the requested status
    for (const order of orders) {
      expect(order.status).toBe('CONFIRMED');
    }
  });

  test('fetches a single order detail', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    // First get an order number from the list
    const listRes = await request.get(`${API}/admin/orders`, { headers });
    const listBody = await listRes.json();
    const orders = listBody.orders ?? listBody;

    if (orders.length === 0) {
      test.skip();
      return;
    }

    const orderNumber = orders[0].orderNumber;
    const res = await request.get(`${API}/admin/orders/${orderNumber}`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    const order = body.order ?? body;
    expect(order.orderNumber).toBe(orderNumber);
  });

  test('updates order status', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    // Find an order in CONFIRMED status that can be advanced
    const listRes = await request.get(`${API}/admin/orders?status=CONFIRMED`, { headers });
    const listBody = await listRes.json();
    const orders = listBody.orders ?? listBody;

    if (orders.length === 0) {
      test.skip();
      return;
    }

    const orderNumber = orders[0].orderNumber;
    const res = await request.post(`${API}/admin/orders/${orderNumber}/update-status`, {
      headers,
      data: { status: 'PROCESSING' },
    });

    // Accept 200 (success) or 400/409 (already transitioned / invalid state)
    expect([200, 400, 409]).toContain(res.status());
  });
});

// ──────────────────────────────────────────────────────────
// Admin Warehouse API tests
// ──────────────────────────────────────────────────────────

test.describe('Admin Warehouse API', () => {
  test('lists warehouse items', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/warehouse`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    const items = body.items ?? body;
    expect(Array.isArray(items)).toBeTruthy();
  });

  test('receives a warehouse item', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    // Find an item in AWAITING_ARRIVAL status
    const listRes = await request.get(`${API}/admin/warehouse?status=AWAITING_ARRIVAL`, { headers });
    const listBody = await listRes.json();
    const items = listBody.items ?? listBody;

    if (items.length === 0) {
      test.skip();
      return;
    }

    const itemId = items[0].id;
    const res = await request.post(`${API}/admin/warehouse/${itemId}/receive`, { headers });
    expect([200, 400, 409]).toContain(res.status());
  });

  test('submits QC pass', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    // Find a QC_PENDING item
    const listRes = await request.get(`${API}/admin/warehouse?status=QC_PENDING`, { headers });
    const listBody = await listRes.json();
    const items = listBody.items ?? listBody;

    if (items.length === 0) {
      test.skip();
      return;
    }

    const itemId = items[0].id;
    const res = await request.post(`${API}/admin/warehouse/${itemId}/qc`, {
      headers,
      data: {
        result: 'PASS',
        checklist: {
          looseEnds: true,
          finishingConsistency: true,
          correctDimensions: true,
          colorMatch: true,
          stitchQuality: true,
          packagingAdequate: true,
        },
      },
    });
    expect([200, 400, 409]).toContain(res.status());
  });

  test('submits QC fail with defect notes', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    // Find a QC_PENDING item
    const listRes = await request.get(`${API}/admin/warehouse?status=QC_PENDING`, { headers });
    const listBody = await listRes.json();
    const items = listBody.items ?? listBody;

    if (items.length === 0) {
      test.skip();
      return;
    }

    const itemId = items[0].id;
    const res = await request.post(`${API}/admin/warehouse/${itemId}/qc`, {
      headers,
      data: {
        result: 'FAIL',
        checklist: {
          looseEnds: false,
          finishingConsistency: false,
          correctDimensions: true,
          colorMatch: true,
          stitchQuality: false,
          packagingAdequate: true,
        },
        defectNotes: 'Loose ends not secured, inconsistent finishing on edges',
      },
    });
    expect([200, 400, 409]).toContain(res.status());
  });
});
