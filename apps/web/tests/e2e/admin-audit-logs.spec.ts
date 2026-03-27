import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

/**
 * E2E tests for Admin Audit Logs API.
 *
 * These tests hit the backend API directly to verify:
 * - Audit logs list endpoint returns data
 * - Filtering by action type works
 * - Pagination with page param works
 *
 * NOTE: Tests assume a seeded database with an admin account.
 * Adjust credentials as needed.
 */

// Helper: log in as a test admin and return auth headers.
async function getAdminHeaders(request: any) {
  const loginRes = await request.post(`${API}/auth/login`, {
    data: { email: 'admin@crochethub.com', password: 'admin123456' },
  });
  const body = await loginRes.json();
  return { Authorization: `Bearer ${body.accessToken}` };
}

test.describe('Admin Audit Logs API', () => {
  test('lists audit logs', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/audit-logs`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    // The API may return { logs: [...] } or { auditLogs: [...] } or a plain array
    const logs = body.logs ?? body.auditLogs ?? body;
    expect(Array.isArray(logs)).toBeTruthy();
  });

  test('filters audit logs by action', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    const res = await request.get(`${API}/admin/audit-logs?action=CREATE`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    const logs = body.logs ?? body.auditLogs ?? body;
    expect(Array.isArray(logs)).toBeTruthy();

    // All returned logs should have the CREATE action (if any are returned)
    for (const log of logs) {
      expect(log.action).toBe('CREATE');
    }
  });

  test('supports pagination', async ({ request }) => {
    const headers = await getAdminHeaders(request);

    // Request page 1 with a small limit
    const res = await request.get(`${API}/admin/audit-logs?page=1&limit=5`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    const logs = body.logs ?? body.auditLogs ?? body;
    expect(Array.isArray(logs)).toBeTruthy();
    // Should return at most 5 items
    expect(logs.length).toBeLessThanOrEqual(5);

    // Request page 2 -- should also succeed (even if empty)
    const res2 = await request.get(`${API}/admin/audit-logs?page=2&limit=5`, { headers });
    expect(res2.status()).toBe(200);
  });
});
