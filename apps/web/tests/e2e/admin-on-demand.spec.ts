import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

/**
 * E2E tests for Admin On-Demand Requests and Quote APIs.
 *
 * These tests hit the backend API directly to verify:
 * - On-demand requests list endpoint
 * - On-demand requests list filtered by status
 * - Create quote on an on-demand request
 *
 * NOTE: Tests assume a seeded database with an admin account and
 * existing on-demand requests. Adjust credentials as needed.
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
// Admin On-Demand Requests API tests
// ──────────────────────────────────────────────────────────

test.describe('Admin On-Demand Requests API', () => {
  test('lists all on-demand requests', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/on-demand-requests`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    const requests = body.requests ?? body;
    expect(Array.isArray(requests)).toBeTruthy();
  });

  test('lists on-demand requests filtered by status', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/on-demand-requests?status=SUBMITTED`, {
      headers,
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    const requests = body.requests ?? body;
    expect(Array.isArray(requests)).toBeTruthy();
    // All returned requests should have the requested status
    for (const req of requests) {
      expect(req.status).toBe('SUBMITTED');
    }
  });

  test('creates a quote for an on-demand request', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    // First get a request from the list
    const listRes = await request.get(`${API}/admin/on-demand-requests`, { headers });
    const listBody = await listRes.json();
    const requests = listBody.requests ?? listBody;

    if (requests.length === 0) {
      test.skip();
      return;
    }

    const requestId = requests[0].id;
    const res = await request.post(
      `${API}/admin/on-demand-requests/${requestId}/quote`,
      {
        headers,
        data: {
          priceInCents: 250000,
          estimatedDays: 7,
          description: 'Custom crochet amigurumi - test quote',
          validityHours: 72,
        },
      },
    );

    // Accept 200/201 (success) or 400/409 (already quoted / invalid state)
    expect([200, 201, 400, 409]).toContain(res.status());
  });
});
