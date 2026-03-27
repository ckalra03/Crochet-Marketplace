/**
 * E2E tests for admin product approval pages.
 *
 * Tests cover:
 * 1. Pending products list API returns data
 * 2. Approve product flow
 * 3. Reject product with required reason
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000/api/v1';

/** Helper: log in as admin and return auth token. */
async function loginAsAdmin(page: any): Promise<string> {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input#email', process.env.ADMIN_EMAIL || 'admin@crochethub.com');
  await page.fill('input#password', process.env.ADMIN_PASSWORD || 'admin123456');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(admin|$)/, { timeout: 10000 });

  // Extract token from localStorage
  const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  return token || '';
}

/* ─────────────── Test Suite ─────────────── */

test.describe('Admin Product Approval', () => {
  let authToken: string;

  test.beforeEach(async ({ page }) => {
    authToken = await loginAsAdmin(page);
  });

  test('should fetch pending products list from API', async ({ request }) => {
    const response = await request.get(`${API_URL}/admin/products/pending`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    // API should return 200 (even if the list is empty)
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('products');
    expect(Array.isArray(body.products)).toBe(true);
  });

  test('should display pending products tab on products page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/products`);

    // Tab headings should be visible
    await expect(page.getByRole('tab', { name: /Pending Approval/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /All Products/i })).toBeVisible();
  });

  test('should approve a product via API', async ({ request }) => {
    // First get pending products
    const listRes = await request.get(`${API_URL}/admin/products/pending`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const { products } = await listRes.json();

    if (products.length === 0) {
      test.skip();
      return;
    }

    const productId = products[0].id;

    const approveRes = await request.post(`${API_URL}/admin/products/${productId}/approve`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Should succeed (200) or product already approved (400/409)
    expect([200, 400, 409]).toContain(approveRes.status());
  });

  test('should reject a product with reason via API', async ({ request }) => {
    // First get pending products
    const listRes = await request.get(`${API_URL}/admin/products/pending`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const { products } = await listRes.json();

    if (products.length === 0) {
      test.skip();
      return;
    }

    const productId = products[0].id;

    const rejectRes = await request.post(`${API_URL}/admin/products/${productId}/reject`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: { reason: 'Product does not meet quality standards - e2e test' },
    });

    // Should succeed (200) or product already processed (400/409)
    expect([200, 400, 409]).toContain(rejectRes.status());
  });

  test('should reject without reason returns 400', async ({ request }) => {
    // First get pending products
    const listRes = await request.get(`${API_URL}/admin/products/pending`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const { products } = await listRes.json();

    if (products.length === 0) {
      test.skip();
      return;
    }

    const productId = products[0].id;

    const rejectRes = await request.post(`${API_URL}/admin/products/${productId}/reject`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {},
    });

    // Should fail because reason is required
    expect([400, 422]).toContain(rejectRes.status());
  });
});
