import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

/**
 * E2E tests for the Seller Orders, Payouts, and Ratings APIs.
 *
 * These tests hit the backend API directly to verify:
 * - Seller orders list endpoint
 * - Seller payouts list endpoint
 * - Seller payout detail endpoint
 * - Seller ratings endpoint
 *
 * NOTE: Tests assume a seeded database with a seller account and
 * valid auth cookies/tokens. Adjust headers as needed for your environment.
 */

// Helper: log in as a test seller and return auth headers.
async function getSellerHeaders(request: any) {
  const loginRes = await request.post(`${API}/auth/login`, {
    data: { email: 'seller@test.com', password: 'seller123456' },
  });
  const body = await loginRes.json();
  return { Authorization: `Bearer ${body.accessToken}` };
}

// ──────────────────────────────────────────────────────────
// Seller Orders API tests
// ──────────────────────────────────────────────────────────

test.describe('Seller Orders API', () => {
  test('lists orders allocated to the seller', async ({ request }) => {
    const headers = await getSellerHeaders(request);

    const res = await request.get(`${API}/seller/orders`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    // Response is { items: [...] } or { orders: [...] } or an array directly
    const orders = Array.isArray(body) ? body : (body.items ?? body.orders);
    expect(orders).toBeInstanceOf(Array);
  });

  test('returns 401 without authentication', async ({ request }) => {
    const res = await request.get(`${API}/seller/orders`);
    expect([401, 403]).toContain(res.status());
  });
});

// ──────────────────────────────────────────────────────────
// Seller Payouts API tests
// ──────────────────────────────────────────────────────────

test.describe('Seller Payouts API', () => {
  test('lists seller payout history', async ({ request }) => {
    const headers = await getSellerHeaders(request);

    const res = await request.get(`${API}/seller/payouts`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    const payouts = Array.isArray(body) ? body : body.payouts;
    expect(payouts).toBeInstanceOf(Array);
  });

  test('fetches payout detail by ID', async ({ request }) => {
    const headers = await getSellerHeaders(request);

    // First, list payouts to get a valid ID
    const listRes = await request.get(`${API}/seller/payouts`, { headers });
    const listBody = await listRes.json();
    const payouts = Array.isArray(listBody) ? listBody : listBody.payouts;

    if (!payouts || payouts.length === 0) {
      test.skip();
      return;
    }

    const payoutId = payouts[0].id;
    const detailRes = await request.get(`${API}/seller/payouts/${payoutId}`, { headers });
    expect(detailRes.status()).toBe(200);

    const detail = await detailRes.json();
    expect(detail.id ?? detail.payoutNumber).toBeDefined();
    expect(detail.status).toBeDefined();
  });

  test('returns 401 for payouts without authentication', async ({ request }) => {
    const res = await request.get(`${API}/seller/payouts`);
    expect([401, 403]).toContain(res.status());
  });
});

// ──────────────────────────────────────────────────────────
// Seller Ratings API tests
// ──────────────────────────────────────────────────────────

test.describe('Seller Ratings API', () => {
  test('lists ratings received by the seller', async ({ request }) => {
    const headers = await getSellerHeaders(request);

    const res = await request.get(`${API}/seller/ratings`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    // Response is either { ratings: [...] } or an array directly
    const ratings = Array.isArray(body) ? body : body.ratings;
    expect(ratings).toBeInstanceOf(Array);
  });

  test('returns 401 for ratings without authentication', async ({ request }) => {
    const res = await request.get(`${API}/seller/ratings`);
    expect([401, 403]).toContain(res.status());
  });
});
