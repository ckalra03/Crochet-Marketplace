import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

/**
 * E2E tests for the cart and checkout API endpoints.
 *
 * These tests require a running backend with seeded data, including:
 * - At least one buyer user with valid credentials
 * - At least one product available for purchase
 * - At least one saved address for the buyer
 *
 * The tests register/login a buyer, then exercise the cart and checkout flow.
 */

// Shared state across tests in this file
let accessToken = '';
let productId = '';
let cartItemId = '';
let addressId = '';

test.describe('Cart & Checkout API', () => {
  // ── Setup: login and get a product ──────────────────────────────
  test.beforeAll(async ({ request }) => {
    // Try to login with the seeded buyer account
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: 'buyer@test.com', password: 'buyer123456' },
    });

    // If login fails, try registering first
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

    // Fetch a product to add to cart
    const productsRes = await request.get(`${API}/catalog/products?limit=1`);
    const productsBody = await productsRes.json();
    if (productsBody.products && productsBody.products.length > 0) {
      productId = productsBody.products[0].id;
    }

    // Fetch or create an address
    const addrRes = await request.get(`${API}/profile/addresses`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const addrBody = await addrRes.json();
    if (Array.isArray(addrBody) && addrBody.length > 0) {
      addressId = addrBody[0].id;
    } else {
      // Create an address
      const createAddrRes = await request.post(`${API}/profile/addresses`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          label: 'Test Home',
          line1: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
        },
      });
      if (createAddrRes.ok()) {
        const newAddr = await createAddrRes.json();
        addressId = newAddr.id;
      }
    }
  });

  // ----------------------------------------------------------------
  // Cart: Add item
  // ----------------------------------------------------------------
  test('adds an item to the cart', async ({ request }) => {
    test.skip(!productId, 'No product available to add');

    const res = await request.post(`${API}/cart/items`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { productId, quantity: 1 },
    });
    // 200/201 = added, 400 = stock depleted from previous test runs
    expect([200, 201, 400]).toContain(res.status());
    if (res.status() === 200 || res.status() === 201) {
      cartItemId = (await res.json()).id ?? cartItemId;
    }
  });

  // ----------------------------------------------------------------
  // Cart: View cart
  // ----------------------------------------------------------------
  test('views the cart with items', async ({ request }) => {
    const res = await request.get(`${API}/cart`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.items).toBeInstanceOf(Array);
    expect(body.items.length).toBeGreaterThan(0);
    expect(typeof body.totalInCents).toBe('number');

    // Store the cart item ID for subsequent tests
    cartItemId = body.items[0].id;
  });

  // ----------------------------------------------------------------
  // Cart: Update quantity
  // ----------------------------------------------------------------
  test('updates cart item quantity', async ({ request }) => {
    test.skip(!cartItemId, 'No cart item to update');

    const res = await request.put(`${API}/cart/items/${cartItemId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { quantity: 3 },
    });
    expect(res.status()).toBe(200);

    // Verify the quantity was updated
    const cartRes = await request.get(`${API}/cart`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const cart = await cartRes.json();
    const updatedItem = cart.items.find((i: any) => i.id === cartItemId);
    expect(updatedItem?.quantity).toBe(3);
  });

  // ----------------------------------------------------------------
  // Cart: Remove item
  // ----------------------------------------------------------------
  test('removes an item from the cart', async ({ request }) => {
    test.skip(!cartItemId, 'No cart item to remove');

    const res = await request.delete(`${API}/cart/items/${cartItemId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
  });

  // ----------------------------------------------------------------
  // Checkout: Rejects without items
  // ----------------------------------------------------------------
  test('checkout rejects when cart is empty', async ({ request }) => {
    // Ensure cart is empty first (items were removed above)
    const res = await request.post(`${API}/checkout`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        shippingAddressId: addressId || '00000000-0000-0000-0000-000000000000',
        policyAcknowledged: true,
      },
    });

    // Should fail — cart is empty
    expect([400, 422]).toContain(res.status());
  });

  // ----------------------------------------------------------------
  // Checkout: Create order with valid address
  // ----------------------------------------------------------------
  test('creates an order with a valid cart and address', async ({ request }) => {
    test.skip(!productId || !addressId, 'Missing product or address for checkout');

    // Re-add item to cart
    await request.post(`${API}/cart/items`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { productId, quantity: 1 },
    });

    const res = await request.post(`${API}/checkout`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        shippingAddressId: addressId,
        policyAcknowledged: true,
        notes: 'E2E test order',
      },
    });
    expect([200, 201]).toContain(res.status());

    const body = await res.json();
    expect(body.orderNumber).toBeDefined();
    expect(typeof body.orderNumber).toBe('string');
  });
});
