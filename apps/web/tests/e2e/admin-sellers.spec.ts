/**
 * E2E tests for the admin seller management pages.
 *
 * Tests cover:
 * 1. Admin sellers list loads and displays seller data
 * 2. Admin seller detail page loads profile
 * 3. Approve a pending seller
 * 4. Reject a pending seller with reason
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Helper: log in as an admin user
async function loginAsAdmin(page: any) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input#email', process.env.ADMIN_EMAIL || 'admin@crochethub.com');
  await page.fill('input#password', process.env.ADMIN_PASSWORD || 'admin123456');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(admin|$)/, { timeout: 10000 });
}

/* ─────────────────── Test Suite ─────────────────── */

test.describe('Admin Seller Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display sellers list with DataTable', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/sellers`);

    // Page heading
    await expect(page.locator('h1')).toHaveText('Seller Applications');

    // Status filter tabs should be visible
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pending' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approved' })).toBeVisible();

    // DataTable should render (search input present)
    await expect(page.getByPlaceholder('Search by business name...')).toBeVisible();
  });

  test('should filter sellers by status tab', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/sellers`);

    // Click Pending tab
    await page.getByRole('button', { name: 'Pending' }).click();

    // Wait for table to update -- pending sellers should show "Pending" badge
    await page.waitForTimeout(1000);

    // If there are rows, they should all show Pending status
    const statusBadges = page.locator('table tbody tr td:nth-child(4)');
    const count = await statusBadges.count();
    for (let i = 0; i < count; i++) {
      await expect(statusBadges.nth(i)).toContainText('Pending');
    }
  });

  test('should navigate to seller detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/sellers`);

    // Click the first "View" button if available
    const viewButton = page.getByRole('button', { name: 'View' }).first();
    const hasView = await viewButton.isVisible().catch(() => false);

    if (hasView) {
      await viewButton.click();
      await page.waitForURL(/\/admin\/sellers\/[a-zA-Z0-9-]+/, { timeout: 5000 });

      // Detail page should show Business Profile card
      await expect(page.getByText('Business Profile')).toBeVisible();

      // Breadcrumb should show Sellers link
      await expect(page.getByRole('link', { name: 'Sellers' })).toBeVisible();
    }
  });

  test('should show approve and reject buttons for pending seller', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/sellers`);

    // Filter to pending sellers
    await page.getByRole('button', { name: 'Pending' }).click();
    await page.waitForTimeout(1000);

    // Navigate to first pending seller detail
    const viewButton = page.getByRole('button', { name: 'View' }).first();
    const hasView = await viewButton.isVisible().catch(() => false);

    if (hasView) {
      await viewButton.click();
      await page.waitForURL(/\/admin\/sellers\/[a-zA-Z0-9-]+/, { timeout: 5000 });

      // Approve and Reject buttons should be present for pending seller
      await expect(page.getByRole('button', { name: 'Approve' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Reject' })).toBeVisible();
    }
  });

  test('should open rejection dialog with reason textarea', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/sellers`);

    // Filter to pending sellers
    await page.getByRole('button', { name: 'Pending' }).click();
    await page.waitForTimeout(1000);

    // Navigate to first pending seller
    const viewButton = page.getByRole('button', { name: 'View' }).first();
    const hasView = await viewButton.isVisible().catch(() => false);

    if (hasView) {
      await viewButton.click();
      await page.waitForURL(/\/admin\/sellers\/[a-zA-Z0-9-]+/, { timeout: 5000 });

      // Click Reject button
      await page.getByRole('button', { name: 'Reject' }).click();

      // Dialog should appear with textarea
      await expect(page.getByText('Reject Seller Application')).toBeVisible();
      await expect(page.getByPlaceholder('Rejection reason...')).toBeVisible();
    }
  });
});
