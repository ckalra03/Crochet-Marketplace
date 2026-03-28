import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

const API = 'http://localhost:4000/api/v1';

/**
 * Guest Cart E2E Tests.
 *
 * Tests that unauthenticated users can add items to cart using
 * X-Session-ID header, view their cart, and that cart merges
 * into user cart on login.
 */
test.describe('Guest Cart', () => {
  let productId: string;
  const sessionId = randomUUID();

  // Get a product to add to cart
  test.beforeAll(async ({ request }) => {
    const res = await request.get(`${API}/catalog/products`);
    const body = await res.json();
    const products = body.products ?? body;
    if (products.length > 0) {
      productId = products[0].id;
    }
  });

  test('guest can add item to cart with X-Session-ID', async ({ request }) => {
    test.skip(!productId, 'No product available');

    const res = await request.post(`${API}/cart/items`, {
      headers: { 'X-Session-ID': sessionId },
      data: { productId, quantity: 1 },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.productId).toBe(productId);
  });

  test('guest can view cart with X-Session-ID', async ({ request }) => {
    test.skip(!productId, 'No product available');

    const res = await request.get(`${API}/cart`, {
      headers: { 'X-Session-ID': sessionId },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.items.length).toBeGreaterThanOrEqual(1);
    expect(body.totalInCents).toBeGreaterThan(0);
  });

  test('guest cannot checkout (requires auth)', async ({ request }) => {
    const res = await request.post(`${API}/checkout`, {
      headers: { 'X-Session-ID': sessionId },
      data: { shippingAddressId: randomUUID() },
    });
    // Checkout requires authentication — should fail
    expect([401, 403]).toContain(res.status());
  });

  test('cart without session ID or auth returns error', async ({ request }) => {
    const res = await request.get(`${API}/cart`);
    // Should return 401 or 500 (no identity provided)
    expect([401, 500]).toContain(res.status());
  });

  test('login merges guest cart into user cart', async ({ request }) => {
    test.skip(!productId, 'No product available');

    // Create a unique buyer for this test to avoid state interference
    const email = `merge-test-${Date.now()}@example.com`;
    const regRes = await request.post(`${API}/auth/register`, {
      data: { name: 'Merge Test', email, password: 'testpass123456' },
    });

    // If registration fails (email exists), skip
    if (regRes.status() !== 201) {
      test.skip(true, 'Could not create test user');
      return;
    }

    const regBody = await regRes.json();
    const userToken = regBody.accessToken;

    // Clear the user's cart first
    const userCartBefore = await request.get(`${API}/cart`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const cartBefore = await userCartBefore.json();
    for (const item of cartBefore.items || []) {
      await request.delete(`${API}/cart/items/${item.id}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
    }

    // Now logout (simulate) and create a guest cart
    const guestSession = randomUUID();
    const addRes = await request.post(`${API}/cart/items`, {
      headers: { 'X-Session-ID': guestSession },
      data: { productId, quantity: 1 },
    });
    expect(addRes.status()).toBe(201);

    // Login again with the guest session ID to trigger merge
    const loginRes = await request.post(`${API}/auth/login`, {
      headers: { 'X-Session-ID': guestSession },
      data: { email, password: 'testpass123456' },
    });
    expect(loginRes.status()).toBe(200);
    const { accessToken } = await loginRes.json();

    // User's cart should now contain the merged guest item
    const cartRes = await request.get(`${API}/cart`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(cartRes.status()).toBe(200);
    const cart = await cartRes.json();
    const found = cart.items.some((item: any) => item.productId === productId);
    expect(found).toBe(true);
  });
});
