import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000/api/v1';

test.describe('Password Reset API', () => {
  // --- Forgot Password ---

  test('forgot-password returns success for valid email', async ({ request }) => {
    // Use the seeded buyer email
    const res = await request.post(`${API}/auth/forgot-password`, {
      data: { email: 'buyer@test.com' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.message).toContain('If an account exists');
  });

  test('forgot-password returns success for non-existent email (no info leak)', async ({ request }) => {
    // Even a non-existent email should get a 200 with the same generic message
    const res = await request.post(`${API}/auth/forgot-password`, {
      data: { email: 'nonexistent-user-xyz@example.com' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.message).toContain('If an account exists');
  });

  test('forgot-password rejects invalid email format', async ({ request }) => {
    const res = await request.post(`${API}/auth/forgot-password`, {
      data: { email: 'not-an-email' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  // --- Reset Password ---

  test('reset-password with invalid token returns error', async ({ request }) => {
    const res = await request.post(`${API}/auth/reset-password`, {
      data: { token: 'invalid-token-abc123', password: 'newpassword123' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid or expired');
  });

  test('reset-password with missing token returns validation error', async ({ request }) => {
    const res = await request.post(`${API}/auth/reset-password`, {
      data: { token: '', password: 'newpassword123' },
    });
    expect(res.status()).toBe(400);
  });

  test('reset-password with short password returns validation error', async ({ request }) => {
    const res = await request.post(`${API}/auth/reset-password`, {
      data: { token: 'some-token', password: 'short' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });
});
