import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

/**
 * E2E tests for the Notification Center API endpoints.
 *
 * These tests require a running backend with seeded data, including:
 * - At least one buyer user with valid credentials
 */

let accessToken = '';

test.describe('Notifications API', () => {
  // Setup: login as buyer
  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: 'buyer@test.com', password: 'buyer123456' },
    });

    if (loginRes.status() !== 200) {
      const regRes = await request.post(`${API}/auth/register`, {
        data: {
          name: 'Test Buyer',
          email: 'buyer@test.com',
          password: 'buyer123456',
        },
      });
      const regBody = await regRes.json();
      accessToken = regBody.accessToken;
    } else {
      const loginBody = await loginRes.json();
      accessToken = loginBody.accessToken;
    }
  });

  test('401 without auth -- notifications list', async ({ request }) => {
    const res = await request.get(`${API}/notifications`);
    expect(res.status()).toBe(401);
  });

  test('401 without auth -- unread count', async ({ request }) => {
    const res = await request.get(`${API}/notifications/unread-count`);
    expect(res.status()).toBe(401);
  });

  test('401 without auth -- mark as read', async ({ request }) => {
    const res = await request.post(`${API}/notifications/some-id/read`);
    expect(res.status()).toBe(401);
  });

  test('401 without auth -- mark all as read', async ({ request }) => {
    const res = await request.post(`${API}/notifications/read-all`);
    expect(res.status()).toBe(401);
  });

  test('notifications list returns paginated response', async ({ request }) => {
    const res = await request.get(`${API}/notifications?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.notifications).toBeDefined();
    expect(Array.isArray(body.notifications)).toBe(true);
    expect(typeof body.total).toBe('number');
    expect(typeof body.page).toBe('number');
    expect(typeof body.limit).toBe('number');
    expect(typeof body.totalPages).toBe('number');
  });

  test('unread count returns a number', async ({ request }) => {
    const res = await request.get(`${API}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.count).toBe('number');
    expect(body.count).toBeGreaterThanOrEqual(0);
  });

  test('mark as read returns 404 for non-existent notification', async ({ request }) => {
    const res = await request.post(`${API}/notifications/00000000-0000-0000-0000-000000000000/read`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(404);
  });

  test('mark all as read succeeds', async ({ request }) => {
    const res = await request.post(`${API}/notifications/read-all`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.count).toBe('number');

    // After marking all as read, unread count should be 0
    const countRes = await request.get(`${API}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const countBody = await countRes.json();
    expect(countBody.count).toBe(0);
  });
});
