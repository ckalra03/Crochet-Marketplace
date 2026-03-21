import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

test.describe('Catalog API', () => {
  test('lists products with pagination', async ({ request }) => {
    const res = await request.get(`${API}/catalog/products`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.products).toBeInstanceOf(Array);
    expect(body.products.length).toBeGreaterThan(0);
    expect(body.pagination.total).toBeGreaterThan(0);
  });

  test('gets product by slug', async ({ request }) => {
    const res = await request.get(`${API}/catalog/products/crochet-teddy-bear`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Crochet Teddy Bear');
    expect(body.sellerProfile.businessName).toBe('Craft Corner Studio');
    expect(body.category).toBeTruthy();
  });

  test('returns 404 for non-existent product', async ({ request }) => {
    const res = await request.get(`${API}/catalog/products/does-not-exist`);
    expect(res.status()).toBe(404);
  });

  test('filters products by type', async ({ request }) => {
    const res = await request.get(`${API}/catalog/products?productType=READY_STOCK`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    body.products.forEach((p: any) => {
      expect(p.productType).toBe('READY_STOCK');
    });
  });

  test('searches products by keyword', async ({ request }) => {
    const res = await request.get(`${API}/catalog/products?search=teddy`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.products.length).toBeGreaterThan(0);
  });

  test('lists categories', async ({ request }) => {
    const res = await request.get(`${API}/catalog/categories`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.length).toBeGreaterThan(0);
    expect(body[0].name).toBeTruthy();
  });

  test('gets products by category slug', async ({ request }) => {
    const res = await request.get(`${API}/catalog/categories/amigurumi/products`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.category.slug).toBe('amigurumi');
    expect(body.products).toBeInstanceOf(Array);
  });
});
