import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

test.describe('Auth API', () => {
  const testEmail = `test-${Date.now()}@example.com`;

  test('registers a new buyer', async ({ request }) => {
    const res = await request.post(`${API}/auth/register`, {
      data: { name: 'Playwright User', email: testEmail, password: 'securepass123' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe(testEmail);
    expect(body.user.role).toBe('BUYER');
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
  });

  test('rejects duplicate registration', async ({ request }) => {
    // Use the seeded buyer email which is guaranteed to already exist
    const res = await request.post(`${API}/auth/register`, {
      data: { name: 'Dup User', email: 'buyer@test.com', password: 'securepass123' },
    });
    expect(res.status()).toBe(409);
  });

  test('rejects invalid registration data', async ({ request }) => {
    const res = await request.post(`${API}/auth/register`, {
      data: { name: 'A', email: 'not-email', password: 'short' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  test('logs in with correct credentials', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@crochethub.com', password: 'admin123456' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user.role).toBe('ADMIN');
    expect(body.accessToken).toBeTruthy();
  });

  test('rejects wrong password', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@crochethub.com', password: 'wrongpassword' },
    });
    expect(res.status()).toBe(401);
  });

  test('accesses protected profile route with token', async ({ request }) => {
    // Login first
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: 'buyer@test.com', password: 'buyer123456' },
    });
    const { accessToken } = await loginRes.json();

    // Access profile
    const profileRes = await request.get(`${API}/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(profileRes.status()).toBe(200);
    const profile = await profileRes.json();
    expect(profile.email).toBe('buyer@test.com');
  });

  test('rejects profile access without token', async ({ request }) => {
    const res = await request.get(`${API}/profile`);
    expect(res.status()).toBe(401);
  });

  test('refreshes token', async ({ request }) => {
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: 'buyer@test.com', password: 'buyer123456' },
    });
    const { refreshToken } = await loginRes.json();

    const refreshRes = await request.post(`${API}/auth/refresh`, {
      data: { refreshToken },
    });
    expect(refreshRes.status()).toBe(200);
    const body = await refreshRes.json();
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
  });
});
