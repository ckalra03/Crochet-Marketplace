import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

async function loginAs(request: any, email: string, password: string) {
  const res = await request.post(`${API}/auth/login`, { data: { email, password } });
  const body = await res.json();
  return body.accessToken;
}

test.describe('Seller Onboarding', () => {
  test('buyer registers as seller', async ({ request }) => {
    // Register a new buyer
    const email = `seller-test-${Date.now()}@test.com`;
    await request.post(`${API}/auth/register`, {
      data: { name: 'New Seller', email, password: 'password123' },
    });
    const token = await loginAs(request, email, 'password123');

    // Register as seller
    const res = await request.post(`${API}/seller/register`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { businessName: 'Test Craft Shop', description: 'We make beautiful crochet items for everyone' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.businessName).toBe('Test Craft Shop');
    expect(body.status).toBe('PENDING');
  });

  test('admin lists pending sellers', async ({ request }) => {
    const token = await loginAs(request, 'admin@crochethub.com', 'admin123456');
    const res = await request.get(`${API}/admin/sellers?status=PENDING`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.sellers).toBeInstanceOf(Array);
  });

  test('admin approves seller', async ({ request }) => {
    const token = await loginAs(request, 'admin@crochethub.com', 'admin123456');

    // Get pending sellers
    const listRes = await request.get(`${API}/admin/sellers?status=PENDING`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { sellers } = await listRes.json();

    if (sellers.length > 0) {
      const res = await request.post(`${API}/admin/sellers/${sellers[0].id}/approve`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('APPROVED');
    }
  });

  test('non-admin cannot access admin routes', async ({ request }) => {
    const token = await loginAs(request, 'buyer@test.com', 'buyer123456');
    const res = await request.get(`${API}/admin/sellers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });
});
