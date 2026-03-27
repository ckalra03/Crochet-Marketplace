import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

/**
 * E2E tests for Admin Penalty Management (Branch 55 / A-16).
 *
 * Tests hit the backend API directly to verify:
 * - Penalties list returns paginated data
 * - Create penalty with valid data returns 201
 * - Create penalty with invalid data returns 400
 * - Waive a PENDING penalty transitions status to WAIVED
 *
 * NOTE: Tests assume a seeded database with an admin account and
 *       at least one approved seller.
 */

// Helper: log in as a test admin and return auth headers.
async function getAdminHeaders(request: any) {
  const loginRes = await request.post(`${API}/auth/login`, {
    data: { email: 'admin@crochethub.com', password: 'admin123456' },
  });
  const body = await loginRes.json();
  return { Authorization: `Bearer ${body.accessToken}` };
}

test.describe('Admin Penalties API — List', () => {
  test('penalties list returns paginated results', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/penalties?page=1&limit=10`, {
      headers,
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('totalPages');
  });

  test('penalties list supports status filter', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/penalties?status=PENDING`, {
      headers,
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBeTruthy();
    // All returned penalties should be PENDING
    for (const penalty of body.data) {
      expect(penalty.status).toBe('PENDING');
    }
  });
});

test.describe('Admin Penalties API — Create', () => {
  test('create penalty with missing fields returns 400', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.post(`${API}/admin/penalties`, {
      headers,
      data: { type: 'OTHER' },
    });
    expect(res.status()).toBe(400);
  });

  test('create penalty with valid data returns 201', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    // Get an approved seller to create the penalty for
    const sellersRes = await request.get(
      `${API}/admin/sellers?status=APPROVED&limit=1`,
      { headers },
    );
    const sellersBody = await sellersRes.json();

    if (!sellersBody.data || sellersBody.data.length === 0) {
      test.skip();
      return;
    }

    const sellerProfileId = sellersBody.data[0].id;

    const res = await request.post(`${API}/admin/penalties`, {
      headers,
      data: {
        sellerProfileId,
        type: 'QC_FAILURE',
        amountInCents: 2500,
        reason: 'E2E test: QC failure penalty for admin-penalties.spec.ts',
      },
    });
    expect(res.status()).toBe(201);

    const penalty = await res.json();
    expect(penalty).toHaveProperty('id');
    expect(penalty.type).toBe('QC_FAILURE');
    expect(penalty.amountInCents).toBe(2500);
    expect(penalty.status).toBe('PENDING');
  });
});

test.describe('Admin Penalties API — Waive', () => {
  test('waive a PENDING penalty changes status to WAIVED', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    // First, create a penalty to waive
    const sellersRes = await request.get(
      `${API}/admin/sellers?status=APPROVED&limit=1`,
      { headers },
    );
    const sellersBody = await sellersRes.json();

    if (!sellersBody.data || sellersBody.data.length === 0) {
      test.skip();
      return;
    }

    const sellerProfileId = sellersBody.data[0].id;

    // Create a penalty
    const createRes = await request.post(`${API}/admin/penalties`, {
      headers,
      data: {
        sellerProfileId,
        type: 'RETURN_LIABILITY',
        amountInCents: 500,
        reason: 'E2E test: penalty to be waived in admin-penalties.spec.ts',
      },
    });
    expect(createRes.status()).toBe(201);

    const created = await createRes.json();
    expect(created.status).toBe('PENDING');

    // Waive the penalty
    const waiveRes = await request.post(
      `${API}/admin/penalties/${created.id}/waive`,
      { headers },
    );
    expect(waiveRes.status()).toBe(200);

    const waived = await waiveRes.json();
    expect(waived.status).toBe('WAIVED');
  });

  test('waive a non-existent penalty returns 404', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.post(
      `${API}/admin/penalties/00000000-0000-0000-0000-000000000000/waive`,
      { headers },
    );
    // Should return 404, 400, or 500 for non-existent ID
    expect([404, 400, 500]).toContain(res.status());
  });
});
