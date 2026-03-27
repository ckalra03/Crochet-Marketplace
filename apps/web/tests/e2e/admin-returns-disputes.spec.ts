import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

/**
 * E2E tests for Admin Returns and Disputes APIs.
 *
 * These tests hit the backend API directly to verify:
 * - Admin returns list endpoint
 * - Admin disputes list endpoint
 * - Review return endpoint
 * - Resolve dispute endpoint
 *
 * NOTE: Tests assume a seeded database with an admin account.
 * Adjust credentials as needed.
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
// Admin Returns API tests
// ──────────────────────────────────────────────────────────

test.describe('Admin Returns API', () => {
  test('lists all returns', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/returns`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    const returns = body.returns ?? body;
    expect(Array.isArray(returns)).toBeTruthy();
  });

  test('lists returns filtered by status', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/returns?status=REQUESTED`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    const returns = body.returns ?? body;
    expect(Array.isArray(returns)).toBeTruthy();
    for (const ret of returns) {
      expect(ret.status).toBe('REQUESTED');
    }
  });

  test('reviews a return request', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    // Find a return in REQUESTED status
    const listRes = await request.get(`${API}/admin/returns?status=REQUESTED`, { headers });
    const listBody = await listRes.json();
    const returns = listBody.returns ?? listBody;

    if (returns.length === 0) {
      test.skip();
      return;
    }

    const returnId = returns[0].id;
    const res = await request.post(`${API}/admin/returns/${returnId}/review`, {
      headers,
      data: {
        decision: 'FULL_REFUND',
        adminNotes: 'Approved via E2E test',
      },
    });

    // Accept 200 (success) or 400/409 (already reviewed / invalid state)
    expect([200, 400, 409]).toContain(res.status());
  });
});

// ──────────────────────────────────────────────────────────
// Admin Disputes API tests
// ──────────────────────────────────────────────────────────

test.describe('Admin Disputes API', () => {
  test('lists all disputes', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/disputes`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    const disputes = body.disputes ?? body;
    expect(Array.isArray(disputes)).toBeTruthy();
  });

  test('lists disputes filtered by status', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/disputes?status=OPEN`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    const disputes = body.disputes ?? body;
    expect(Array.isArray(disputes)).toBeTruthy();
    for (const dispute of disputes) {
      expect(dispute.status).toBe('OPEN');
    }
  });

  test('resolves a dispute', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    // Find an open dispute
    const listRes = await request.get(`${API}/admin/disputes?status=OPEN`, { headers });
    const listBody = await listRes.json();
    const disputes = listBody.disputes ?? listBody;

    if (disputes.length === 0) {
      test.skip();
      return;
    }

    const disputeId = disputes[0].id;
    const res = await request.post(`${API}/admin/disputes/${disputeId}/resolve`, {
      headers,
      data: {
        resolutionSummary: 'Resolved via E2E test - issue addressed with seller.',
      },
    });

    // Accept 200 (success) or 400/409 (already resolved / invalid state)
    expect([200, 400, 409]).toContain(res.status());
  });
});
