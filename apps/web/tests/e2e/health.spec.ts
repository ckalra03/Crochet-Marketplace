import { test, expect } from '@playwright/test';

test.describe('Health Checks', () => {
  test('frontend loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Crochet Hub');
  });

  test('API health endpoint returns ok', async ({ request }) => {
    const response = await request.get('http://localhost:4000/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('ok');
  });
});
