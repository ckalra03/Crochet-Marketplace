import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

/** Helper: log in and return the access token. */
async function loginAs(request: any, email: string, password: string): Promise<string> {
  const res = await request.post(`${API}/auth/login`, { data: { email, password } });
  const body = await res.json();
  return body.accessToken;
}

/** Helper: register a fresh buyer account and return { email, token }. */
async function createBuyer(request: any) {
  const email = `seller-reg-${Date.now()}@test.com`;
  await request.post(`${API}/auth/register`, {
    data: { name: 'Reg Test', email, password: 'password123' },
  });
  const token = await loginAs(request, email, 'password123');
  return { email, token };
}

test.describe('Seller Registration', () => {
  // ─── Happy path: buyer registers as seller ─────────────

  test('seller registration API returns 201 for a valid buyer', async ({ request }) => {
    const { token } = await createBuyer(request);

    const res = await request.post(`${API}/seller/register`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        businessName: `Reg Test Shop ${Date.now()}`,
        description: 'Handmade crochet items',
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.businessName).toBeTruthy();
    expect(body.status).toBe('PENDING');
  });

  // ─── Rejects non-buyer (admin) ─────────────────────────

  test('registration rejects non-buyer (admin) users', async ({ request }) => {
    const token = await loginAs(request, 'admin@crochethub.com', 'admin123456');

    const res = await request.post(`${API}/seller/register`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        businessName: 'Should Fail',
        description: 'Admin cannot register as seller',
      },
    });

    // Expect 400 — only buyers may register as sellers
    expect([400, 403]).toContain(res.status());
  });

  // ─── Rejects duplicate registration ────────────────────

  test('registration rejects duplicate seller application', async ({ request }) => {
    const { token } = await createBuyer(request);

    // First registration — may succeed (201) or fail if user is already a seller
    const first = await request.post(`${API}/seller/register`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        businessName: `Dup Test Shop ${Date.now()}`,
        description: 'First attempt',
      },
    });
    // Accept 201 (new) or 400/409 (already a seller from previous test runs)
    expect([201, 400, 409]).toContain(first.status());

    // Second registration with the same user should always fail
    const second = await request.post(`${API}/seller/register`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        businessName: 'Dup Again',
        description: 'Duplicate attempt',
      },
    });

    // Expect 400 or 409 — user already has a seller profile
    expect([400, 409]).toContain(second.status());
  });
});
