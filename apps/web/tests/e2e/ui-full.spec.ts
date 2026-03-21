import { test, expect, type Page } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';
const APP = 'http://localhost:3000';

test.setTimeout(60000); // 60s per test

// ─── Helpers ──────────────────────────────────────────

async function apiLogin(request: any, email: string, password: string) {
  const res = await request.post(`${API}/auth/login`, {
    data: { email, password },
  });
  const body = await res.json();
  return body;
}

async function loginOnUI(page: Page, email: string, password: string) {
  await page.goto(`${APP}/login`);
  await page.fill('input#email', email);
  await page.fill('input#password', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
}

async function setAuthInBrowser(page: Page, request: any, email: string, password: string) {
  const { accessToken, refreshToken, user } = await apiLogin(request, email, password);
  await page.goto(APP);
  await page.evaluate(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { accessToken, refreshToken, user },
  );
}

// ─────────────────────────────────────────────────────
// 1. PUBLIC PAGES (No Auth)
// ─────────────────────────────────────────────────────
test.describe('1. Public Pages', () => {
  test('1.1 home page loads with hero and products', async ({ page }) => {
    await page.goto(APP);
    await expect(page.locator('h1')).toContainText('Crochet');
    // Hero section
    await expect(page.getByText('Shop Now')).toBeVisible();
    // Categories section
    await expect(page.getByText('Browse by Category')).toBeVisible();
    // Featured products section
    await expect(page.getByText('Featured Products')).toBeVisible();
    // Seller CTA
    await expect(page.getByText('Are You a Crochet Artist?')).toBeVisible();
  });

  test('1.2 navigation links are visible', async ({ page }) => {
    await page.goto(APP);
    await expect(page.getByRole('link', { name: 'Shop', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign Up' })).toBeVisible();
  });

  test('1.3 product catalog page loads', async ({ page }) => {
    await page.goto(`${APP}/products`);
    await expect(page.getByText('Shop All Products')).toBeVisible();
    // Filter controls
    await expect(page.locator('input[name="search"]')).toBeVisible();
    await expect(page.locator('select[name="productType"]')).toBeVisible();
    // Products displayed
    await expect(page.getByText('products found')).toBeVisible();
  });

  test('1.4 product catalog shows product cards', async ({ page }) => {
    await page.goto(`${APP}/products`);
    await page.waitForLoadState('networkidle');
    // At least one product card should be visible (from seed)
    await expect(page.getByText('Crochet Teddy Bear')).toBeVisible({ timeout: 10000 });
  });

  test('1.5 product detail page loads', async ({ page }) => {
    await page.goto(`${APP}/products/crochet-teddy-bear`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Crochet Teddy Bear' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Craft Corner Studio').first()).toBeVisible();
    await expect(page.getByText('899').first()).toBeVisible();
    // Button shows "Add to Cart" or "Out of Stock" depending on inventory
    await expect(page.getByText(/Add to Cart|Out of Stock/).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Product Details')).toBeVisible();
  });

  test('1.6 product detail shows return policy', async ({ page }) => {
    await page.goto(`${APP}/products/crochet-teddy-bear`);
    await expect(page.getByText(/Returns accepted|No returns/)).toBeVisible();
  });

  test('1.7 non-existent product shows 404', async ({ page }) => {
    const response = await page.goto(`${APP}/products/does-not-exist-xyz`);
    expect(response?.status()).toBe(404);
  });

  test('1.8 catalog filter by type works', async ({ page }) => {
    await page.goto(`${APP}/products?productType=MADE_TO_ORDER`);
    await expect(page.getByText('products found')).toBeVisible();
    // Should see Made to Order badge
    const badges = page.getByText('Made to Order');
    expect(await badges.count()).toBeGreaterThan(0);
  });

  test('1.9 catalog search works', async ({ page }) => {
    await page.goto(`${APP}/products?search=blanket`);
    await expect(page.getByText('products found')).toBeVisible();
  });

  test('1.10 footer is visible', async ({ page }) => {
    await page.goto(APP);
    await expect(page.getByText('Crochet Hub. All rights reserved')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────
// 2. AUTH PAGES
// ─────────────────────────────────────────────────────
test.describe('2. Auth Pages', () => {
  test('2.1 login page renders', async ({ page }) => {
    await page.goto(`${APP}/login`);
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByText("Don't have an account?")).toBeVisible();
  });

  test('2.2 register page renders', async ({ page }) => {
    await page.goto(`${APP}/register`);
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();
  });

  test('2.3 login with valid credentials redirects', async ({ page }) => {
    await loginOnUI(page, 'admin@crochethub.com', 'admin123456');
    // Admin should redirect to /admin
    await expect(page).toHaveURL(/admin/);
  });

  test('2.4 login shows error for wrong password', async ({ page }) => {
    await page.goto(`${APP}/login`);
    await page.fill('input#email', 'admin@crochethub.com');
    await page.fill('input#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
    // Toast error should appear
    await expect(page.getByText(/Invalid|failed/i)).toBeVisible();
  });

  test('2.5 register creates account', async ({ page }) => {
    const email = `uitest-${Date.now()}@test.com`;
    await page.goto(`${APP}/register`);
    await page.fill('input#name', 'UI Test User');
    await page.fill('input#email', email);
    await page.fill('input#password', 'password123');
    await page.fill('input#confirmPassword', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    // Should redirect to home
    await expect(page).toHaveURL(APP + '/');
  });

  test('2.6 login link from register page works', async ({ page }) => {
    await page.goto(`${APP}/register`);
    await page.click('text=Sign in');
    await expect(page).toHaveURL(`${APP}/login`);
  });

  test('2.7 register link from login page works', async ({ page }) => {
    await page.goto(`${APP}/login`);
    await page.click('text=Sign up');
    await expect(page).toHaveURL(`${APP}/register`);
  });
});

// ─────────────────────────────────────────────────────
// 3. BUYER PAGES (Authenticated)
// ─────────────────────────────────────────────────────
test.describe('3. Buyer Pages', () => {
  test.beforeEach(async ({ page, request }) => {
    await setAuthInBrowser(page, request, 'buyer@test.com', 'buyer123456');
  });

  test('3.1 nav shows auth state after login', async ({ page }) => {
    await page.goto(APP);
    await page.waitForTimeout(500);
    // Should NOT show Login/Sign Up buttons
    // Should show cart icon
    await expect(page.locator('[data-testid="cart-icon"], a[href="/cart"]').first()).toBeVisible();
  });

  test('3.2 cart page loads (empty or with items)', async ({ page }) => {
    await page.goto(`${APP}/cart`);
    await page.waitForTimeout(1500);
    // Should see either "Your cart is empty" or cart items
    const hasEmpty = await page.getByText('Your cart is empty').isVisible().catch(() => false);
    const hasItems = await page.getByText('Shopping Cart').isVisible().catch(() => false);
    expect(hasEmpty || hasItems).toBeTruthy();
  });

  test('3.3 add to cart from product detail', async ({ page }) => {
    // Use bohemian-market-bag which has stock=8
    await page.goto(`${APP}/products/bohemian-market-bag`);
    await page.waitForLoadState('networkidle');
    const addBtn = page.getByText('Add to Cart');
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(/Added to cart|added/i)).toBeVisible({ timeout: 5000 });
  });

  test('3.4 checkout page loads', async ({ page }) => {
    // Add to cart first
    await page.goto(`${APP}/products/bohemian-market-bag`);
    await page.waitForLoadState('networkidle');
    const addBtn = page.getByText('Add to Cart');
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();
    await page.waitForTimeout(2000);

    await page.goto(`${APP}/checkout`);
    await page.waitForTimeout(2000);
    await expect(page.getByText('Checkout').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Shipping Address')).toBeVisible();
  });

  test('3.5 orders page loads', async ({ page }) => {
    await page.goto(`${APP}/orders`);
    await page.waitForTimeout(1500);
    await expect(page.getByRole('heading', { name: 'My Orders' })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────
// 4. SELLER PAGES
// ─────────────────────────────────────────────────────
test.describe('4. Seller Pages', () => {
  test.beforeEach(async ({ page, request }) => {
    await setAuthInBrowser(page, request, 'seller@test.com', 'seller123456');
  });

  test('4.1 seller dashboard loads with KPIs', async ({ page }) => {
    await page.goto(`${APP}/seller`);
    await page.waitForTimeout(2000);
    await expect(page.getByRole('heading', { name: 'Seller Dashboard' })).toBeVisible();
    await expect(page.getByText('Total Orders')).toBeVisible();
    await expect(page.getByText('Active Products')).toBeVisible();
    await expect(page.getByText('Revenue')).toBeVisible();
    await expect(page.getByText('Avg Rating')).toBeVisible();
  });

  test('4.2 seller sidebar navigation visible', async ({ page }) => {
    await page.goto(`${APP}/seller`);
    await expect(page.getByText('Seller Panel')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Payouts' })).toBeVisible();
  });

  test('4.3 seller products page loads', async ({ page }) => {
    await page.goto(`${APP}/seller/products`);
    await page.waitForTimeout(2000);
    await expect(page.getByText('My Products')).toBeVisible();
    await expect(page.getByText('Add Product')).toBeVisible();
    // Should show seeded products
    await expect(page.getByText('Crochet Teddy Bear')).toBeVisible();
  });

  test('4.4 create product page renders', async ({ page }) => {
    await page.goto(`${APP}/seller/products/new`);
    await page.waitForTimeout(1000);
    await expect(page.getByText('Add New Product')).toBeVisible();
    await expect(page.getByText('Basic Info')).toBeVisible();
    await expect(page.getByText('Type & Pricing')).toBeVisible();
    // Form fields present
    const selectCount = await page.locator('select').count();
    expect(selectCount).toBeGreaterThanOrEqual(3);
  });

  test('4.5 seller can create a product', async ({ page }) => {
    await page.goto(`${APP}/seller/products/new`);
    await page.waitForTimeout(1000);

    // Fill form
    // Fill fields by locators since labels may not match exactly
    await page.locator('input').first().fill('UI Test Product');
    await page.locator('textarea').fill('A beautiful test product created during Playwright UI testing');

    // Select first category
    await page.locator('select').first().selectOption({ index: 1 });

    // Fill price
    await page.locator('input[type="number"]').first().fill('29900');
    // Fill stock
    const stockInput = page.locator('input[type="number"]').nth(1);
    if (await stockInput.isVisible()) {
      await stockInput.fill('5');
    }

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Should redirect to products list
    await expect(page).toHaveURL(/seller\/products/);
  });
});

// ─────────────────────────────────────────────────────
// 5. ADMIN PAGES
// ─────────────────────────────────────────────────────
test.describe('5. Admin Pages', () => {
  test.beforeEach(async ({ page, request }) => {
    await setAuthInBrowser(page, request, 'admin@crochethub.com', 'admin123456');
  });

  test('5.1 admin dashboard loads with KPIs', async ({ page }) => {
    await page.goto(`${APP}/admin`);
    await page.waitForTimeout(2000);
    await expect(page.getByText('Admin Dashboard')).toBeVisible();
    await expect(page.getByText('Orders Today')).toBeVisible();
    await expect(page.getByText('Pending Sellers')).toBeVisible();
    await expect(page.getByText('Active Products')).toBeVisible();
    await expect(page.getByText('Quick Actions')).toBeVisible();
  });

  test('5.2 admin sidebar navigation visible', async ({ page }) => {
    await page.goto(`${APP}/admin`);
    await expect(page.getByText('Admin Panel')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sellers' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Warehouse / QC' })).toBeVisible();
  });

  test('5.3 admin sellers page loads', async ({ page }) => {
    await page.goto(`${APP}/admin/sellers`);
    await page.waitForTimeout(2000);
    await expect(page.getByText('Seller Applications')).toBeVisible();
    // Filter buttons
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'PENDING' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'APPROVED' })).toBeVisible();
  });

  test('5.4 admin products page loads', async ({ page }) => {
    await page.goto(`${APP}/admin/products`);
    await page.waitForTimeout(2000);
    await expect(page.getByText('Product Approval Queue')).toBeVisible();
  });

  test('5.5 admin orders page loads', async ({ page }) => {
    await page.goto(`${APP}/admin/orders`);
    await page.waitForTimeout(2000);
    await expect(page.getByText('Order Management')).toBeVisible();
    // Filter buttons
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'CONFIRMED' })).toBeVisible();
  });

  test('5.6 admin warehouse page loads', async ({ page }) => {
    await page.goto(`${APP}/admin/warehouse`);
    await page.waitForTimeout(2000);
    await expect(page.getByText('Warehouse / QC Dashboard')).toBeVisible();
    // Filter buttons
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
  });

  test('5.7 admin quick actions navigate correctly', async ({ page }) => {
    await page.goto(`${APP}/admin`);
    await page.waitForTimeout(1500);
    await page.click('text=Review Sellers');
    await expect(page).toHaveURL(`${APP}/admin/sellers`);
  });

  test('5.8 admin can filter sellers by status', async ({ page }) => {
    await page.goto(`${APP}/admin/sellers`);
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'APPROVED' }).click();
    await page.waitForTimeout(1500);
    // Page should still be visible (didn't crash)
    await expect(page.getByText('Seller Applications')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────
// 6. FULL USER JOURNEY: Browse → Cart → Checkout → Order
// ─────────────────────────────────────────────────────
test.describe('6. Full Purchase Journey', () => {
  test('6.1 buyer browses, adds to cart, checks out', async ({ page, request }) => {
    // Login as buyer
    await setAuthInBrowser(page, request, 'buyer@test.com', 'buyer123456');

    // 1. Browse products
    await page.goto(`${APP}/products`);
    await page.waitForTimeout(1000);
    await expect(page.getByText('Shop All Products')).toBeVisible();

    // 2. Click on Bohemian Market Bag (has stock)
    await page.getByText('Bohemian Market Bag').first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Bohemian Market Bag' })).toBeVisible({ timeout: 10000 });

    // 3. Add to cart
    await expect(page.getByText('Add to Cart')).toBeVisible({ timeout: 10000 });
    await page.getByText('Add to Cart').click();
    await page.waitForTimeout(2000);

    // 4. Go to cart
    await page.goto(`${APP}/cart`);
    await page.waitForTimeout(1500);
    await expect(page.getByText('Shopping Cart')).toBeVisible();

    // 5. Go to checkout
    await page.click('text=Checkout');
    await page.waitForTimeout(1500);
    await expect(page.getByText('Shipping Address')).toBeVisible();

    // 6. Acknowledge policy
    await page.click('input[type="checkbox"]');

    // 7. Place order
    await page.click('button:has-text("Place Order")');
    await page.waitForTimeout(3000);

    // 8. Should redirect to order detail
    await expect(page.getByText(/CH-/)).toBeVisible();
    await expect(page.getByText('Order Timeline')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────
// 7. RESPONSIVE & ACCESSIBILITY BASICS
// ─────────────────────────────────────────────────────
test.describe('7. Responsiveness', () => {
  test('7.1 home page renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(APP);
    await expect(page.locator('h1')).toContainText('Crochet');
    await expect(page.getByText('Shop Now')).toBeVisible();
  });

  test('7.2 product detail renders on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${APP}/products/bohemian-market-bag`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Bohemian Market Bag' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Add to Cart|Out of Stock/).first()).toBeVisible({ timeout: 10000 });
  });

  test('7.3 login page renders on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${APP}/login`);
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });
});
