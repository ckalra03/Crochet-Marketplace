import { test, expect } from '@playwright/test';

test.describe('Health Checks', () => {
  test('frontend loads successfully', async ({ page }) => {
    // Next.js dev server first load can be slow — increase timeout
    test.setTimeout(60000);
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('API health endpoint returns ok', async ({ request }) => {
    const response = await request.get('http://localhost:4000/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('ok');
  });
});
