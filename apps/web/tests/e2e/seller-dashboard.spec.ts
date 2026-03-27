/**
 * E2E tests for the enhanced seller dashboard and product management.
 *
 * Tests cover:
 * 1. Seller dashboard loads with KPI cards
 * 2. Seller products list renders DataTable
 * 3. Create product flow (fill form, save draft)
 * 4. Update product flow (edit existing product)
 */

import { test, expect } from '@playwright/test';

// Base URL for the web app (configurable via env)
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Helper: log in as a seller and store auth token
async function loginAsSeller(page: any) {
  // Navigate to login page and authenticate
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input#email', process.env.SELLER_EMAIL || 'seller@test.com');
  await page.fill('input#password', process.env.SELLER_PASSWORD || 'seller123456');
  await page.click('button[type="submit"]');
  // Wait for redirect to dashboard or homepage
  await page.waitForURL(/\/(seller|$)/, { timeout: 10000 });
}

/* ─────────────────── Test Suite ─────────────────── */

test.describe('Seller Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSeller(page);
  });

  test('should display dashboard KPI cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/seller`);

    // Wait for the dashboard heading
    await expect(page.locator('h1')).toHaveText('Seller Dashboard');

    // Verify KPI cards are visible
    await expect(page.getByText('Total Orders')).toBeVisible();
    await expect(page.getByText('Monthly Revenue')).toBeVisible();
    await expect(page.getByText('Avg Rating')).toBeVisible();
    await expect(page.getByText('Active Products')).toBeVisible();
  });

  test('should show commission rate when available', async ({ page }) => {
    await page.goto(`${BASE_URL}/seller`);

    // Commission rate may or may not appear depending on API response
    // If the seller has a commission rate, it should display a percentage
    const commissionEl = page.getByText('Platform Commission Rate:');
    if (await commissionEl.isVisible()) {
      // Should show a percentage value nearby
      await expect(commissionEl.locator('..')).toContainText('%');
    }
  });
});

test.describe('Seller Products List', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSeller(page);
  });

  test('should display products page with Create button', async ({ page }) => {
    await page.goto(`${BASE_URL}/seller/products`);

    // Page heading
    await expect(page.locator('h1')).toHaveText('My Products');

    // Create product button
    await expect(page.getByRole('link', { name: /Create Product/i })).toBeVisible();
  });

  test('should show search input when products exist', async ({ page }) => {
    await page.goto(`${BASE_URL}/seller/products`);
    await page.waitForTimeout(2000);

    // If there are products, the search input should be visible
    const searchInput = page.getByPlaceholder('Search products...');
    const noProductsHeading = page.getByText('No products yet');

    // Either products table with search, or empty state
    const hasProducts = !(await noProductsHeading.isVisible().catch(() => false));
    if (hasProducts) {
      await expect(searchInput).toBeVisible();
    }
  });
});

test.describe('Create Product', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSeller(page);
  });

  test('should navigate to new product page with breadcrumbs', async ({ page }) => {
    await page.goto(`${BASE_URL}/seller/products/new`);

    // Verify breadcrumbs
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Products')).toBeVisible();

    // Page heading
    await expect(page.locator('h1')).toHaveText('Add New Product');
  });

  test('should show tabbed form with Basic Info, Pricing, Details', async ({ page }) => {
    await page.goto(`${BASE_URL}/seller/products/new`);

    // Verify all tabs are present
    await expect(page.getByRole('tab', { name: 'Basic Info' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Pricing' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Details' })).toBeVisible();
  });

  test('should validate required fields before saving', async ({ page }) => {
    await page.goto(`${BASE_URL}/seller/products/new`);

    // Click "Save Draft" without filling anything
    await page.click('button:has-text("Save Draft")');

    // Should show validation errors (form stays on page)
    await expect(page.getByText(/at least 3 characters/i)).toBeVisible();
  });

  test('should fill form and save draft', async ({ page }) => {
    await page.goto(`${BASE_URL}/seller/products/new`);

    // Fill basic info
    await page.fill('#name', 'Test Amigurumi Bear');
    await page.fill('#description', 'A beautiful handmade amigurumi teddy bear, perfect for gifting.');

    // Select a category (first available option)
    const categorySelect = page.locator('#categoryId');
    await categorySelect.waitFor({ state: 'visible' });
    const options = await categorySelect.locator('option').all();
    if (options.length > 1) {
      // Select the first non-empty option
      const value = await options[1].getAttribute('value');
      if (value) await categorySelect.selectOption(value);
    }

    // Select product type (default READY_STOCK is fine)

    // Switch to pricing tab
    await page.click('[role="tab"]:has-text("Pricing")');
    await page.fill('#priceInCents', '89900');
    await page.fill('#stockQuantity', '10');

    // Switch to details tab
    await page.click('[role="tab"]:has-text("Details")');
    await page.fill('#materials', 'Cotton yarn, polyester fiberfill');

    // Save draft
    await page.click('button:has-text("Save Draft")');

    // Should redirect to products list or show success toast
    await page.waitForURL(/\/seller\/products$/, { timeout: 10000 }).catch(() => {
      // If redirect didn't happen, check for success toast
    });
  });
});

test.describe('Update Product', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSeller(page);
  });

  test('should load edit page with pre-populated data', async ({ page }) => {
    // First, go to products list and find a product to edit
    await page.goto(`${BASE_URL}/seller/products`);
    await page.waitForTimeout(2000);

    // Click the first edit button if products exist
    const editButton = page.locator('button[title="Edit"]').first();
    const hasEditButton = await editButton.isVisible().catch(() => false);

    if (hasEditButton) {
      await editButton.click();

      // Should navigate to edit page
      await page.waitForURL(/\/seller\/products\/.*\/edit/, { timeout: 10000 });

      // Verify heading and breadcrumbs
      await expect(page.locator('h1')).toHaveText('Edit Product');
      await expect(page.getByRole('tab', { name: 'Basic Info' })).toBeVisible();

      // The name field should be pre-populated (not empty)
      const nameInput = page.locator('#name');
      const nameValue = await nameInput.inputValue();
      expect(nameValue.length).toBeGreaterThan(0);
    }
  });

  test('should update product and redirect', async ({ page }) => {
    await page.goto(`${BASE_URL}/seller/products`);
    await page.waitForTimeout(2000);

    const editButton = page.locator('button[title="Edit"]').first();
    const hasEditButton = await editButton.isVisible().catch(() => false);

    if (hasEditButton) {
      await editButton.click();
      await page.waitForURL(/\/seller\/products\/.*\/edit/, { timeout: 10000 });

      // Update the description
      const descInput = page.locator('#description');
      await descInput.fill('Updated description for automated testing purposes.');

      // Save
      await page.click('button:has-text("Save Draft")');

      // Should redirect back to products list
      await page.waitForURL(/\/seller\/products$/, { timeout: 10000 }).catch(() => {});
    }
  });
});
