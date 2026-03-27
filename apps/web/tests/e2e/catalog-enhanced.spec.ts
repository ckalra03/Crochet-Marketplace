import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

test.describe('Enhanced Catalog API', () => {
  // ------------------------------------------------------------------
  // Filtered products
  // ------------------------------------------------------------------
  test('filters products by product type and returns only matching items', async ({
    request,
  }) => {
    const res = await request.get(
      `${API}/catalog/products?productType=READY_STOCK`,
    );
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.products).toBeInstanceOf(Array);

    // Every returned product must match the requested type
    for (const product of body.products) {
      expect(product.productType).toBe('READY_STOCK');
    }

    // Pagination metadata should be present
    expect(body.pagination).toBeDefined();
    expect(typeof body.pagination.total).toBe('number');
  });

  test('filters products by multiple params (search + sort)', async ({
    request,
  }) => {
    const res = await request.get(
      `${API}/catalog/products?search=crochet&sort=price_asc`,
    );
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.products).toBeInstanceOf(Array);
    expect(body.pagination).toBeDefined();

    // If more than one product, verify ascending price order
    if (body.products.length > 1) {
      for (let i = 1; i < body.products.length; i++) {
        const prevPrice = body.products[i - 1].priceInCents ?? 0;
        const currPrice = body.products[i].priceInCents ?? 0;
        expect(currPrice).toBeGreaterThanOrEqual(prevPrice);
      }
    }
  });

  // ------------------------------------------------------------------
  // Pagination
  // ------------------------------------------------------------------
  test('paginates products with page and limit params', async ({ request }) => {
    // Fetch page 1 with limit of 2
    const res1 = await request.get(
      `${API}/catalog/products?page=1&limit=2`,
    );
    expect(res1.status()).toBe(200);

    const body1 = await res1.json();
    expect(body1.products.length).toBeLessThanOrEqual(2);
    expect(body1.pagination.page).toBe(1);

    // If there are more pages, fetch page 2
    if (body1.pagination.totalPages > 1) {
      const res2 = await request.get(
        `${API}/catalog/products?page=2&limit=2`,
      );
      expect(res2.status()).toBe(200);

      const body2 = await res2.json();
      expect(body2.products.length).toBeLessThanOrEqual(2);
      expect(body2.pagination.page).toBe(2);

      // Pages should contain different products
      const ids1 = body1.products.map((p: any) => p.id);
      const ids2 = body2.products.map((p: any) => p.id);
      const overlap = ids1.filter((id: string) => ids2.includes(id));
      expect(overlap.length).toBe(0);
    }
  });

  // ------------------------------------------------------------------
  // Category products
  // ------------------------------------------------------------------
  test('fetches products for a specific category slug', async ({ request }) => {
    // First get categories to find a valid slug
    const catRes = await request.get(`${API}/catalog/categories`);
    expect(catRes.status()).toBe(200);

    const categories = await catRes.json();
    expect(categories.length).toBeGreaterThan(0);

    const slug = categories[0].slug;

    // Fetch products for that category
    const res = await request.get(
      `${API}/catalog/categories/${slug}/products`,
    );
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.category).toBeDefined();
    expect(body.category.slug).toBe(slug);
    expect(body.products).toBeInstanceOf(Array);
    expect(body.pagination).toBeDefined();
  });

  test('returns 404 for non-existent category slug', async ({ request }) => {
    const res = await request.get(
      `${API}/catalog/categories/does-not-exist-xyz/products`,
    );
    // API should return 404 for unknown category
    expect(res.status()).toBe(404);
  });
});
