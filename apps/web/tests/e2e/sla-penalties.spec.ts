import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

/**
 * E2E tests for SLA Monitoring, Penalties, and Seller Performance APIs.
 *
 * Tests hit the backend API directly to verify:
 * - SLA dashboard returns summary data
 * - SLA breaches list returns paginated results
 * - Penalties CRUD (list, create, waive)
 * - Seller performance rankings
 *
 * NOTE: Tests assume a seeded database with an admin account.
 */

// Helper: log in as a test admin and return auth headers.
async function getAdminHeaders(request: any) {
  const loginRes = await request.post(`${API}/auth/login`, {
    data: { email: 'admin@crochethub.com', password: 'admin123456' },
  });
  const body = await loginRes.json();
  return { Authorization: `Bearer ${body.accessToken}` };
}

test.describe('Admin SLA Dashboard API', () => {
  test('SLA dashboard returns summary data', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/sla/dashboard`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('totalBreaches');
    expect(typeof body.totalBreaches).toBe('number');
    expect(body).toHaveProperty('breachesByType');
    expect(Array.isArray(body.breachesByType)).toBeTruthy();
    expect(body).toHaveProperty('topOffendingSellers');
    expect(Array.isArray(body.topOffendingSellers)).toBeTruthy();
  });

  test('SLA breaches list returns paginated results', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/sla/breaches?page=1&limit=10`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('limit');
    expect(body).toHaveProperty('totalPages');
  });

  test('SLA breaches supports slaType filter', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/sla/breaches?slaType=DISPATCH`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBeTruthy();
  });
});

test.describe('Admin Penalties API', () => {
  test('penalties list returns paginated results', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/penalties?page=1&limit=10`, { headers });
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

    const res = await request.get(`${API}/admin/penalties?status=PENDING`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('create penalty requires valid data', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    // Missing required fields should fail validation
    const res = await request.post(`${API}/admin/penalties`, {
      headers,
      data: { type: 'OTHER' },
    });
    // Should return 400 for validation error
    expect(res.status()).toBe(400);
  });

  test('create and waive penalty lifecycle', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    // First, get a seller to create a penalty for
    const sellersRes = await request.get(`${API}/admin/sellers?status=APPROVED&limit=1`, { headers });
    const sellersBody = await sellersRes.json();

    // Skip if no approved sellers exist in seed data
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
        type: 'OTHER',
        amountInCents: 1000,
        reason: 'E2E test penalty for SLA compliance testing',
      },
    });
    expect(createRes.status()).toBe(201);

    const penalty = await createRes.json();
    expect(penalty).toHaveProperty('id');
    expect(penalty.type).toBe('OTHER');
    expect(penalty.amountInCents).toBe(1000);
    expect(penalty.status).toBe('PENDING');

    // Waive the penalty
    const waiveRes = await request.post(`${API}/admin/penalties/${penalty.id}/waive`, { headers });
    expect(waiveRes.status()).toBe(200);

    const waived = await waiveRes.json();
    expect(waived.status).toBe('WAIVED');
  });
});

test.describe('Admin Seller Performance API', () => {
  test('seller performance rankings returns paginated results', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/performance/sellers?page=1&limit=10`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('totalPages');
  });

  test('seller performance supports sort params', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(
      `${API}/admin/performance/sellers?sortBy=totalOrders&order=desc`,
      { headers },
    );
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBeTruthy();
  });
});

test.describe('Seller SLA & Performance APIs (auth required)', () => {
  test('unauthenticated request to seller performance returns 401', async ({ request }) => {
    const res = await request.get(`${API}/seller/performance`);
    expect(res.status()).toBe(401);
  });

  test('unauthenticated request to seller penalties returns 401', async ({ request }) => {
    const res = await request.get(`${API}/seller/penalties`);
    expect(res.status()).toBe(401);
  });

  test('unauthenticated request to seller SLA breaches returns 401', async ({ request }) => {
    const res = await request.get(`${API}/seller/sla/breaches`);
    expect(res.status()).toBe(401);
  });
});
