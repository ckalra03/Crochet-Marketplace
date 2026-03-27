import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

/**
 * E2E tests for Admin Analytics and Platform Settings APIs.
 *
 * These tests hit the backend API directly to verify:
 * - Revenue analytics returns an array
 * - Order analytics returns volume and status distribution
 * - Seller analytics returns ranked list
 * - Settings CRUD (read all, update, read single)
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

test.describe('Admin Analytics APIs', () => {
  test('revenue analytics returns array', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/analytics/revenue?period=monthly`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();

    // Each item should have period, revenue, orderCount
    for (const item of body) {
      expect(item).toHaveProperty('period');
      expect(item).toHaveProperty('revenue');
      expect(item).toHaveProperty('orderCount');
    }
  });

  test('revenue analytics accepts date range', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(
      `${API}/admin/analytics/revenue?period=daily&startDate=2025-01-01&endDate=2026-12-31`,
      { headers },
    );
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('order analytics returns volume and distribution', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/analytics/orders`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('totalOrders');
    expect(body).toHaveProperty('totalRevenueInCents');
    expect(body).toHaveProperty('averageOrderValueInCents');
    expect(body).toHaveProperty('statusDistribution');
    expect(Array.isArray(body.statusDistribution)).toBeTruthy();
  });

  test('seller analytics returns ranked list', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/analytics/sellers?limit=5`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();

    for (const seller of body) {
      expect(seller).toHaveProperty('sellerProfileId');
      expect(seller).toHaveProperty('businessName');
      expect(seller).toHaveProperty('revenue');
      expect(seller).toHaveProperty('orderCount');
    }
  });

  test('category analytics returns ranked list', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/analytics/categories?limit=5`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();

    for (const cat of body) {
      expect(cat).toHaveProperty('categoryId');
      expect(cat).toHaveProperty('categoryName');
      expect(cat).toHaveProperty('revenue');
      expect(cat).toHaveProperty('orderCount');
    }
  });
});

test.describe('Admin Platform Settings API', () => {
  test('get all settings returns array', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/settings`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();

    // Should have default settings seeded
    const keys = body.map((s: any) => s.key);
    expect(keys).toContain('commissionRate');
    expect(keys).toContain('returnWindowDays');
  });

  test('update a setting', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    // Update returnWindowDays to 14
    const res = await request.put(`${API}/admin/settings`, {
      headers,
      data: { key: 'returnWindowDays', value: 14 },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.key).toBe('returnWindowDays');
    expect(body.value).toBe(14);
  });

  test('updated setting persists on re-read', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    // First update
    await request.put(`${API}/admin/settings`, {
      headers,
      data: { key: 'returnWindowDays', value: 21 },
    });

    // Read all and check
    const res = await request.get(`${API}/admin/settings`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    const setting = body.find((s: any) => s.key === 'returnWindowDays');
    expect(setting).toBeDefined();
    expect(setting.value).toBe(21);

    // Restore default
    await request.put(`${API}/admin/settings`, {
      headers,
      data: { key: 'returnWindowDays', value: 7 },
    });
  });

  test('upsert creates new setting', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.put(`${API}/admin/settings`, {
      headers,
      data: { key: 'testCustomSetting', value: { enabled: true, threshold: 42 } },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.key).toBe('testCustomSetting');
    expect(body.value).toEqual({ enabled: true, threshold: 42 });
  });
});
