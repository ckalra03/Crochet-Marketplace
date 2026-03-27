import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

/**
 * E2E tests for the Wishlist API endpoints.
 *
 * These tests require a running backend with seeded data, including:
 * - At least one buyer user with valid credentials
 * - At least one product available in the catalog
 */

let accessToken = '';
let productId = '';

test.describe('Wishlist API', () => {
  // Setup: login and get a product
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

    // Fetch a product to wishlist
    const productsRes = await request.get(`${API}/catalog/products?limit=1`);
    const productsBody = await productsRes.json();
    if (productsBody.products && productsBody.products.length > 0) {
      productId = productsBody.products[0].id;
    }
  });

  test('401 without auth -- wishlist list', async ({ request }) => {
    const res = await request.get(`${API}/wishlist`);
    expect(res.status()).toBe(401);
  });

  test('401 without auth -- add to wishlist', async ({ request }) => {
    const res = await request.post(`${API}/wishlist/some-product-id`);
    expect(res.status()).toBe(401);
  });

  test('add to wishlist returns 201', async ({ request }) => {
    test.skip(!productId, 'No product available');

    // Clean up first (ignore errors if not in wishlist)
    await request.delete(`${API}/wishlist/${productId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const res = await request.post(`${API}/wishlist/${productId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.productId).toBe(productId);
  });

  test('duplicate add is idempotent', async ({ request }) => {
    test.skip(!productId, 'No product available');

    // Add again -- should still return 201 without error
    const res = await request.post(`${API}/wishlist/${productId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(201);
  });

  test('list wishlist returns items', async ({ request }) => {
    test.skip(!productId, 'No product available');

    // Ensure product is in wishlist first
    await request.post(`${API}/wishlist/${productId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const res = await request.get(`${API}/wishlist`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Response may be { items, total } or array directly
    const items = body.items ?? body;
    expect(Array.isArray(items)).toBeTruthy();
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  test('wishlist ids returns product IDs', async ({ request }) => {
    test.skip(!productId, 'No product available');

    // Ensure product is in wishlist first
    await request.post(`${API}/wishlist/${productId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const res = await request.get(`${API}/wishlist/ids`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const ids = body.productIds ?? body;
    expect(ids).toContain(productId);
  });

  test('remove from wishlist returns 204', async ({ request }) => {
    test.skip(!productId, 'No product available');

    const res = await request.delete(`${API}/wishlist/${productId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(204);

    // Verify it's gone
    const listRes = await request.get(`${API}/wishlist/ids`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const listBody = await listRes.json();
    expect(listBody.productIds).not.toContain(productId);
  });
});
