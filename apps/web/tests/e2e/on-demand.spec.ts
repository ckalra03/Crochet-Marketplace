import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

/**
 * On-Demand (Custom Order) API e2e tests.
 *
 * These tests exercise the on-demand request endpoints from the buyer's
 * perspective. A valid buyer auth token is required for most operations.
 *
 * NOTE: The accept/reject quote tests depend on a quote existing in the
 * test database. They are skipped by default -- enable them once test
 * seed data includes a quoted on-demand request.
 */

let authToken = '';
let createdRequestId = '';

test.describe('On-Demand API', () => {
  // Authenticate as a buyer before running tests
  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: 'buyer@test.com', password: 'buyer123456' },
    });
    if (loginRes.ok()) {
      const body = await loginRes.json();
      authToken = body.token ?? body.accessToken ?? '';
    }
  });

  test('submit a new on-demand request', async ({ request }) => {
    const res = await request.post(`${API}/on-demand`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        description: 'I would like a small amigurumi cat in pastel pink and white, about 15cm tall.',
        budgetMinCents: 50000,
        budgetMaxCents: 150000,
        expectedBy: '2026-05-01',
      },
    });

    // 201 Created or 200 OK depending on API implementation
    expect([200, 201]).toContain(res.status());

    const body = await res.json();
    expect(body.id).toBeTruthy();
    expect(body.description).toContain('amigurumi cat');
    createdRequestId = body.id;
  });

  test('list on-demand requests', async ({ request }) => {
    const res = await request.get(`${API}/on-demand`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();

    // Response may be an array or { requests: [] }
    const requests = Array.isArray(body) ? body : body.requests;
    expect(requests).toBeInstanceOf(Array);
  });

  test('get on-demand request detail', async ({ request }) => {
    // Skip if we didn't create a request earlier
    test.skip(!createdRequestId, 'No request was created in previous test');

    const res = await request.get(`${API}/on-demand/${createdRequestId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(createdRequestId);
    expect(body.description).toBeTruthy();
  });

  test('returns 401 without auth token', async ({ request }) => {
    const res = await request.get(`${API}/on-demand`);
    expect(res.status()).toBe(401);
  });

  test('returns 404 for non-existent request', async ({ request }) => {
    const res = await request.get(
      `${API}/on-demand/00000000-0000-0000-0000-000000000000`,
      { headers: { Authorization: `Bearer ${authToken}` } },
    );
    expect([404, 403]).toContain(res.status());
  });

  // Quote acceptance/rejection tests -- skipped until test seed data is available
  test.skip('accept a quote on an on-demand request', async ({ request }) => {
    // Requires a request with status QUOTED and a valid quoteId in seed data
    const requestId = 'SEED_REQUEST_ID';
    const quoteId = 'SEED_QUOTE_ID';

    const res = await request.post(
      `${API}/on-demand/${requestId}/quotes/${quoteId}/accept`,
      { headers: { Authorization: `Bearer ${authToken}` } },
    );
    expect(res.status()).toBe(200);
  });

  test.skip('reject a quote on an on-demand request', async ({ request }) => {
    const requestId = 'SEED_REQUEST_ID';
    const quoteId = 'SEED_QUOTE_ID';

    const res = await request.post(
      `${API}/on-demand/${requestId}/quotes/${quoteId}/reject`,
      { headers: { Authorization: `Bearer ${authToken}` } },
    );
    expect(res.status()).toBe(200);
  });
});
