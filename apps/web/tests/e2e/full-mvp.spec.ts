import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

// Tests run with --workers=1 to avoid rate limiting

// Token cache to avoid repeated logins hitting rate limiter
const tokenCache: Record<string, string> = {};

async function login(request: any, email: string, password: string) {
  // Return cached token if available
  if (tokenCache[email]) {
    return { accessToken: tokenCache[email], refreshToken: '' };
  }
  const res = await request.post(`${API}/auth/login`, {
    data: { email, password },
  });
  if (res.status() === 429) {
    // Rate limited — wait and retry once
    await new Promise((r) => setTimeout(r, 2000));
    const retry = await request.post(`${API}/auth/login`, {
      data: { email, password },
    });
    const body = await retry.json();
    tokenCache[email] = body.accessToken;
    return body;
  }
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.accessToken).toBeTruthy();
  tokenCache[email] = body.accessToken;
  return body;
}

// ─────────────────────────────────────────────────────
// 1. AUTH
// ─────────────────────────────────────────────────────
test.describe('1. Auth', () => {
  const uniqueEmail = `pw-test-${Date.now()}@test.com`;

  test('1.1 registers a new buyer', async ({ request }) => {
    const res = await request.post(`${API}/auth/register`, {
      data: { name: 'PW Test User', email: uniqueEmail, password: 'password123' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe(uniqueEmail);
    expect(body.user.role).toBe('BUYER');
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
  });

  test('1.2 rejects duplicate email', async ({ request }) => {
    // Use seeded buyer email which definitely exists
    const res = await request.post(`${API}/auth/register`, {
      data: { name: 'Dup', email: 'buyer@test.com', password: 'password123' },
    });
    expect(res.status()).toBe(409);
  });

  test('1.3 rejects invalid registration', async ({ request }) => {
    const res = await request.post(`${API}/auth/register`, {
      data: { name: 'A', email: 'bad', password: '123' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
    expect(body.details).toBeTruthy();
  });

  test('1.4 logs in with correct credentials', async ({ request }) => {
    const body = await login(request, 'admin@crochethub.com', 'admin123456');
    expect(body.user.role).toBe('ADMIN');
  });

  test('1.5 rejects wrong password', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@crochethub.com', password: 'wrongpass' },
    });
    expect(res.status()).toBe(401);
  });

  test('1.6 rejects unauthenticated profile access', async ({ request }) => {
    const res = await request.get(`${API}/profile`);
    expect(res.status()).toBe(401);
  });

  test('1.7 accesses profile with token', async ({ request }) => {
    const { accessToken } = await login(request, 'buyer@test.com', 'buyer123456');
    const res = await request.get(`${API}/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.email).toBe('buyer@test.com');
  });

  test('1.8 refreshes token', async ({ request }) => {
    // Login fresh (bypass cache) to get a real refresh token
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: 'buyer@test.com', password: 'buyer123456' },
    });
    const { refreshToken } = await loginRes.json();
    expect(refreshToken).toBeTruthy();

    const res = await request.post(`${API}/auth/refresh`, {
      data: { refreshToken },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────
// 2. CATALOG
// ─────────────────────────────────────────────────────
test.describe('2. Catalog', () => {
  test('2.1 lists products', async ({ request }) => {
    const res = await request.get(`${API}/catalog/products`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.products).toBeInstanceOf(Array);
    expect(body.products.length).toBeGreaterThan(0);
    expect(body.pagination.total).toBeGreaterThan(0);
  });

  test('2.2 gets product by slug', async ({ request }) => {
    const res = await request.get(`${API}/catalog/products/crochet-teddy-bear`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Crochet Teddy Bear');
    expect(body.productType).toBe('READY_STOCK');
    expect(body.priceInCents).toBe(89900);
    expect(body.sellerProfile).toBeTruthy();
    expect(body.sellerProfile.businessName).toBe('Craft Corner Studio');
    expect(body.category).toBeTruthy();
  });

  test('2.3 returns 404 for non-existent product', async ({ request }) => {
    const res = await request.get(`${API}/catalog/products/non-existent-slug`);
    expect(res.status()).toBe(404);
  });

  test('2.4 filters by product type', async ({ request }) => {
    const res = await request.get(`${API}/catalog/products?productType=READY_STOCK`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.products.length).toBeGreaterThan(0);
    for (const p of body.products) {
      expect(p.productType).toBe('READY_STOCK');
    }
  });

  test('2.5 filters by product type MTO', async ({ request }) => {
    const res = await request.get(`${API}/catalog/products?productType=MADE_TO_ORDER`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.products.length).toBeGreaterThan(0);
    for (const p of body.products) {
      expect(p.productType).toBe('MADE_TO_ORDER');
    }
  });

  test('2.6 searches by keyword', async ({ request }) => {
    const res = await request.get(`${API}/catalog/products?search=teddy`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.products.length).toBeGreaterThan(0);
  });

  test('2.7 sorts by price ascending', async ({ request }) => {
    const res = await request.get(`${API}/catalog/products?sort=price_asc`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    if (body.products.length >= 2) {
      expect(body.products[0].priceInCents).toBeLessThanOrEqual(body.products[1].priceInCents);
    }
  });

  test('2.8 lists categories', async ({ request }) => {
    const res = await request.get(`${API}/catalog/categories`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.length).toBeGreaterThanOrEqual(7);
  });

  test('2.9 gets products by category', async ({ request }) => {
    const res = await request.get(`${API}/catalog/categories/amigurumi/products`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.category.slug).toBe('amigurumi');
    expect(body.products).toBeInstanceOf(Array);
  });

  test('2.10 returns 404 for non-existent category', async ({ request }) => {
    const res = await request.get(`${API}/catalog/categories/fake-category/products`);
    expect(res.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────
// 3. PROFILE & ADDRESSES
// ─────────────────────────────────────────────────────
test.describe('3. Profile & Addresses', () => {
  test('3.1 updates profile', async ({ request }) => {
    const { accessToken } = await login(request, 'buyer@test.com', 'buyer123456');
    const res = await request.put(`${API}/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'Updated Buyer Name' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Updated Buyer Name');
  });

  test('3.2 lists addresses', async ({ request }) => {
    const { accessToken } = await login(request, 'buyer@test.com', 'buyer123456');
    const res = await request.get(`${API}/profile/addresses`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toBeInstanceOf(Array);
    expect(body.length).toBeGreaterThan(0);
  });

  test('3.3 creates address', async ({ request }) => {
    const { accessToken } = await login(request, 'buyer@test.com', 'buyer123456');
    const res = await request.post(`${API}/profile/addresses`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        label: 'Office',
        line1: '100 MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.label).toBe('Office');
    expect(body.city).toBe('Mumbai');
  });
});

// ─────────────────────────────────────────────────────
// 4. SELLER ONBOARDING
// ─────────────────────────────────────────────────────
test.describe('4. Seller Onboarding', () => {
  test('4.1 buyer registers as seller', async ({ request }) => {
    // Create a fresh buyer
    const email = `seller-pw-${Date.now()}@test.com`;
    await request.post(`${API}/auth/register`, {
      data: { name: 'PW Seller', email, password: 'password123' },
    });
    const { accessToken } = await login(request, email, 'password123');

    const res = await request.post(`${API}/seller/register`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        businessName: 'PW Craft Shop',
        description: 'Playwright test seller making beautiful crochet items',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.businessName).toBe('PW Craft Shop');
    expect(body.status).toBe('PENDING');
  });

  test('4.2 admin lists pending sellers', async ({ request }) => {
    const { accessToken } = await login(request, 'admin@crochethub.com', 'admin123456');
    const res = await request.get(`${API}/admin/sellers?status=PENDING`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.sellers).toBeInstanceOf(Array);
  });

  test('4.3 admin approves pending seller', async ({ request }) => {
    const { accessToken } = await login(request, 'admin@crochethub.com', 'admin123456');
    const listRes = await request.get(`${API}/admin/sellers?status=PENDING`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { sellers } = await listRes.json();

    if (sellers.length > 0) {
      const res = await request.post(`${API}/admin/sellers/${sellers[0].id}/approve`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('APPROVED');
    }
  });

  test('4.4 buyer cannot access admin routes', async ({ request }) => {
    const { accessToken } = await login(request, 'buyer@test.com', 'buyer123456');
    const res = await request.get(`${API}/admin/sellers`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(403);
  });
});

// ─────────────────────────────────────────────────────
// 5. SELLER PRODUCT MANAGEMENT
// ─────────────────────────────────────────────────────
test.describe('5. Seller Products', () => {
  test('5.1 seller lists own products', async ({ request }) => {
    const { accessToken } = await login(request, 'seller@test.com', 'seller123456');
    const res = await request.get(`${API}/seller/products`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.products).toBeInstanceOf(Array);
    expect(body.products.length).toBeGreaterThan(0);
  });

  test('5.2 seller creates product', async ({ request }) => {
    const { accessToken } = await login(request, 'seller@test.com', 'seller123456');

    // Get a category
    const catRes = await request.get(`${API}/catalog/categories`);
    const categories = await catRes.json();
    const categoryId = categories[0].id;

    const res = await request.post(`${API}/seller/products`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'PW Test Scarf',
        description: 'A beautiful handmade crochet scarf created during Playwright testing',
        categoryId,
        productType: 'READY_STOCK',
        priceInCents: 49900,
        stockQuantity: 3,
        returnPolicy: 'DEFECT_ONLY',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('PW Test Scarf');
    expect(body.status).toBe('DRAFT');
  });

  test('5.3 seller submits product for approval', async ({ request }) => {
    const { accessToken } = await login(request, 'seller@test.com', 'seller123456');

    // Find the draft product
    const listRes = await request.get(`${API}/seller/products`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { products } = await listRes.json();
    const draft = products.find((p: any) => p.status === 'DRAFT');

    if (draft) {
      const res = await request.post(`${API}/seller/products/${draft.id}/submit`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('PENDING_APPROVAL');
    }
  });

  test('5.4 admin lists pending products', async ({ request }) => {
    const { accessToken } = await login(request, 'admin@crochethub.com', 'admin123456');
    const res = await request.get(`${API}/admin/products/pending`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.products).toBeInstanceOf(Array);
  });

  test('5.5 admin approves product', async ({ request }) => {
    const { accessToken } = await login(request, 'admin@crochethub.com', 'admin123456');
    const listRes = await request.get(`${API}/admin/products/pending`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { products } = await listRes.json();

    if (products.length > 0) {
      const res = await request.post(`${API}/admin/products/${products[0].id}/approve`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('APPROVED');
    }
  });
});

// ─────────────────────────────────────────────────────
// 6. CART & CHECKOUT
// ─────────────────────────────────────────────────────
test.describe('6. Cart & Checkout', () => {
  test('6.1 adds item to cart', async ({ request }) => {
    const { accessToken } = await login(request, 'buyer@test.com', 'buyer123456');

    // Get first product
    const catRes = await request.get(`${API}/catalog/products`);
    const { products } = await catRes.json();
    const productId = products[0].id;

    const res = await request.post(`${API}/cart/items`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { productId, quantity: 1 },
    });
    expect(res.status()).toBe(201);
  });

  test('6.2 views cart', async ({ request }) => {
    const { accessToken } = await login(request, 'buyer@test.com', 'buyer123456');
    const res = await request.get(`${API}/cart`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.items).toBeInstanceOf(Array);
    expect(body.totalInCents).toBeGreaterThan(0);
  });

  test('6.3 checkout creates order', async ({ request }) => {
    const { accessToken } = await login(request, 'buyer@test.com', 'buyer123456');

    // Get buyer's address
    const addrRes = await request.get(`${API}/profile/addresses`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const addresses = await addrRes.json();

    const res = await request.post(`${API}/checkout`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        shippingAddressId: addresses[0].id,
        policyAcknowledged: true,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.orderNumber).toBeTruthy();
    expect(body.status).toBe('CONFIRMED');
    expect(body.paymentStatus).toBe('PAID');
  });
});

// ─────────────────────────────────────────────────────
// 7. ORDER MANAGEMENT
// ─────────────────────────────────────────────────────
test.describe('7. Order Management', () => {
  test('7.1 buyer lists orders', async ({ request }) => {
    const { accessToken } = await login(request, 'buyer@test.com', 'buyer123456');
    const res = await request.get(`${API}/orders`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.orders).toBeInstanceOf(Array);
    expect(body.orders.length).toBeGreaterThan(0);
  });

  test('7.2 buyer views order detail', async ({ request }) => {
    const { accessToken } = await login(request, 'buyer@test.com', 'buyer123456');
    const listRes = await request.get(`${API}/orders`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { orders } = await listRes.json();
    const orderNumber = orders[0].orderNumber;

    const res = await request.get(`${API}/orders/${orderNumber}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.orderNumber).toBe(orderNumber);
    expect(body.items).toBeInstanceOf(Array);
    expect(body.items.length).toBeGreaterThan(0);
  });

  test('7.3 admin lists all orders', async ({ request }) => {
    const { accessToken } = await login(request, 'admin@crochethub.com', 'admin123456');
    const res = await request.get(`${API}/admin/orders`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.orders).toBeInstanceOf(Array);
    expect(body.orders.length).toBeGreaterThan(0);
  });

  test('7.4 admin advances order status', async ({ request }) => {
    const { accessToken } = await login(request, 'admin@crochethub.com', 'admin123456');
    const listRes = await request.get(`${API}/admin/orders`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { orders } = await listRes.json();
    const confirmed = orders.find((o: any) => o.status === 'CONFIRMED');

    if (confirmed) {
      const res = await request.post(`${API}/admin/orders/${confirmed.orderNumber}/update-status`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { status: 'PROCESSING' },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('PROCESSING');
    }
  });

  test('7.5 admin rejects invalid transition', async ({ request }) => {
    const { accessToken } = await login(request, 'admin@crochethub.com', 'admin123456');
    const listRes = await request.get(`${API}/admin/orders`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { orders } = await listRes.json();
    if (orders.length > 0) {
      const res = await request.post(`${API}/admin/orders/${orders[0].orderNumber}/update-status`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { status: 'DELIVERED' },
      });
      // Should fail — can't jump to DELIVERED
      expect(res.status()).toBe(400);
    }
  });

  test('7.6 seller sees allocated orders', async ({ request }) => {
    const { accessToken } = await login(request, 'seller@test.com', 'seller123456');
    const res = await request.get(`${API}/seller/orders`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.items).toBeInstanceOf(Array);
  });
});

// ─────────────────────────────────────────────────────
// 8. ON-DEMAND REQUESTS
// ─────────────────────────────────────────────────────
test.describe('8. On-Demand', () => {
  test('8.1 buyer submits on-demand request', async ({ request }) => {
    const { accessToken } = await login(request, 'buyer@test.com', 'buyer123456');
    const res = await request.post(`${API}/on-demand`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        description: 'I want a custom crochet elephant toy, about 15 inches tall, in grey and pink colors.',
        budgetMinCents: 100000,
        budgetMaxCents: 200000,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.requestNumber).toMatch(/^ODR-/);
    expect(body.status).toBe('SUBMITTED');
  });

  test('8.2 buyer lists on-demand requests', async ({ request }) => {
    const { accessToken } = await login(request, 'buyer@test.com', 'buyer123456');
    const res = await request.get(`${API}/on-demand`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.requests).toBeInstanceOf(Array);
    expect(body.requests.length).toBeGreaterThan(0);
  });

  test('8.3 admin lists on-demand requests', async ({ request }) => {
    const { accessToken } = await login(request, 'admin@crochethub.com', 'admin123456');
    const res = await request.get(`${API}/admin/on-demand-requests`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.requests).toBeInstanceOf(Array);
  });

  test('8.4 admin creates quote', async ({ request }) => {
    const { accessToken } = await login(request, 'admin@crochethub.com', 'admin123456');
    const listRes = await request.get(`${API}/admin/on-demand-requests`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { requests } = await listRes.json();
    const submitted = requests.find((r: any) => r.status === 'SUBMITTED');

    if (submitted) {
      const res = await request.post(`${API}/admin/on-demand-requests/${submitted.id}/quote`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          priceInCents: 150000,
          estimatedDays: 14,
          description: 'Custom elephant with premium cotton yarn',
          validityHours: 48,
        },
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.priceInCents).toBe(150000);
    }
  });
});

// ─────────────────────────────────────────────────────
// 9. ADMIN DASHBOARD
// ─────────────────────────────────────────────────────
test.describe('9. Admin Dashboard', () => {
  test('9.1 returns dashboard stats', async ({ request }) => {
    const { accessToken } = await login(request, 'admin@crochethub.com', 'admin123456');
    const res = await request.get(`${API}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.totalOrders).toBe('number');
    expect(typeof body.activeProducts).toBe('number');
    expect(typeof body.activeSellers).toBe('number');
    expect(body.activeProducts).toBeGreaterThan(0);
  });

  test('9.2 returns audit logs', async ({ request }) => {
    const { accessToken } = await login(request, 'admin@crochethub.com', 'admin123456');
    const res = await request.get(`${API}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.logs).toBeInstanceOf(Array);
    expect(body.pagination).toBeTruthy();
  });

  test('9.3 filters audit logs by action', async ({ request }) => {
    const { accessToken } = await login(request, 'admin@crochethub.com', 'admin123456');
    const res = await request.get(`${API}/admin/audit-logs?action=order`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
  });
});

// ─────────────────────────────────────────────────────
// 10. SELLER DASHBOARD
// ─────────────────────────────────────────────────────
test.describe('10. Seller Dashboard', () => {
  test('10.1 returns seller dashboard stats', async ({ request }) => {
    const { accessToken } = await login(request, 'seller@test.com', 'seller123456');
    const res = await request.get(`${API}/seller/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.overview).toBeTruthy();
    expect(typeof body.overview.totalOrders).toBe('number');
    expect(typeof body.overview.activeProducts).toBe('number');
    expect(typeof body.overview.avgRating).toBe('number');
    expect(body.commissionRate).toBe(1500);
  });

  test('10.2 seller views payouts', async ({ request }) => {
    const { accessToken } = await login(request, 'seller@test.com', 'seller123456');
    const res = await request.get(`${API}/seller/payouts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.payouts).toBeInstanceOf(Array);
  });

  test('10.3 seller views ratings', async ({ request }) => {
    const { accessToken } = await login(request, 'seller@test.com', 'seller123456');
    const res = await request.get(`${API}/seller/ratings`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ratings).toBeInstanceOf(Array);
    expect(typeof body.avgScore).toBe('number');
  });
});

// ─────────────────────────────────────────────────────
// 11. RBAC ENFORCEMENT
// ─────────────────────────────────────────────────────
test.describe('11. RBAC', () => {
  test('11.1 buyer cannot access admin routes', async ({ request }) => {
    const { accessToken } = await login(request, 'buyer@test.com', 'buyer123456');
    const res = await request.get(`${API}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Insufficient permissions');
  });

  test('11.2 buyer cannot access seller routes', async ({ request }) => {
    const { accessToken } = await login(request, 'buyer@test.com', 'buyer123456');
    const res = await request.get(`${API}/seller/products`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // Should fail - buyer is not a seller (no profile)
    expect(res.status()).not.toBe(200);
  });

  test('11.3 unauthenticated cannot access cart', async ({ request }) => {
    const res = await request.get(`${API}/cart`);
    expect(res.status()).toBe(401);
  });

  test('11.4 unauthenticated cannot checkout', async ({ request }) => {
    const res = await request.post(`${API}/checkout`, {
      data: { shippingAddressId: 'fake', policyAcknowledged: true },
    });
    expect(res.status()).toBe(401);
  });
});
