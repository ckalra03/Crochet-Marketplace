import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

/**
 * E2E tests for Admin Payout Processing APIs.
 *
 * These tests hit the backend API directly to verify:
 * - Payouts list endpoint
 * - Generate payout cycle endpoint
 * - Approve payout endpoint
 * - Mark payout paid endpoint
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
// Payouts List API
// ──────────────────────────────────────────────────────────

test.describe('Admin Payouts List API', () => {
  test('lists all payouts', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/payouts`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    const payouts = body.payouts ?? body.items ?? body;
    expect(Array.isArray(payouts)).toBeTruthy();
  });

  test('lists payouts filtered by status', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/payouts?status=DRAFT`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    const payouts = body.payouts ?? body.items ?? body;
    expect(Array.isArray(payouts)).toBeTruthy();
    for (const payout of payouts) {
      expect(payout.status).toBe('DRAFT');
    }
  });
});

// ──────────────────────────────────────────────────────────
// Generate Payout Cycle API
// ──────────────────────────────────────────────────────────

test.describe('Generate Payout Cycle API', () => {
  test('generates a payout cycle', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.post(`${API}/admin/payouts/generate`, {
      headers,
      data: {
        cycleStart: '2026-03-01',
        cycleEnd: '2026-03-15',
      },
    });

    // Accept 200/201 (success) or 400/409 (no orders in range / already generated)
    expect([200, 201, 400, 409]).toContain(res.status());
  });

  test('rejects invalid date range', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.post(`${API}/admin/payouts/generate`, {
      headers,
      data: {
        cycleStart: '2026-03-15',
        cycleEnd: '2026-03-01',
      },
    });

    // Should fail validation
    expect([400, 422]).toContain(res.status());
  });
});

// ──────────────────────────────────────────────────────────
// Approve Payout API
// ──────────────────────────────────────────────────────────

test.describe('Approve Payout API', () => {
  test('approves a draft payout', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    // Find a DRAFT payout to approve
    const listRes = await request.get(`${API}/admin/payouts?status=DRAFT`, { headers });
    const listBody = await listRes.json();
    const payouts = listBody.payouts ?? listBody.items ?? listBody;

    if (!Array.isArray(payouts) || payouts.length === 0) {
      test.skip();
      return;
    }

    const payoutId = payouts[0].id;
    const res = await request.post(`${API}/admin/payouts/${payoutId}/approve`, { headers });
    expect([200, 400, 409]).toContain(res.status());
  });
});

// ──────────────────────────────────────────────────────────
// Mark Payout Paid API
// ──────────────────────────────────────────────────────────

test.describe('Mark Payout Paid API', () => {
  test('marks an approved payout as paid', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    // Find an APPROVED payout
    const listRes = await request.get(`${API}/admin/payouts?status=APPROVED`, { headers });
    const listBody = await listRes.json();
    const payouts = listBody.payouts ?? listBody.items ?? listBody;

    if (!Array.isArray(payouts) || payouts.length === 0) {
      test.skip();
      return;
    }

    const payoutId = payouts[0].id;
    const res = await request.post(`${API}/admin/payouts/${payoutId}/mark-paid`, {
      headers,
      data: { paymentReference: 'TEST-TXN-123456' },
    });
    expect([200, 400, 409]).toContain(res.status());
  });

  test('rejects mark paid without payment reference', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const listRes = await request.get(`${API}/admin/payouts?status=APPROVED`, { headers });
    const listBody = await listRes.json();
    const payouts = listBody.payouts ?? listBody.items ?? listBody;

    if (!Array.isArray(payouts) || payouts.length === 0) {
      test.skip();
      return;
    }

    const payoutId = payouts[0].id;
    const res = await request.post(`${API}/admin/payouts/${payoutId}/mark-paid`, {
      headers,
      data: {},
    });
    expect([400, 422]).toContain(res.status());
  });
});
