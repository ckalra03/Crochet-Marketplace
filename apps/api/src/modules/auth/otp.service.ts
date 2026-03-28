/**
 * OTP Service — generates, stores, and verifies one-time passwords.
 *
 * Uses an in-memory Map for MVP. In production, swap this out for Redis
 * to support multi-instance deployments.
 *
 * OTPs expire after 5 minutes. Each send overwrites the previous OTP
 * for the same emailOrPhone so only the latest code is valid.
 */

import { createModuleLogger } from '../../support/logger';

const log = createModuleLogger('otp');

interface StoredOTP {
  otp: string;
  expiresAt: number; // Unix timestamp in ms
}

// In-memory store: key = emailOrPhone, value = { otp, expiresAt }
const otpStore = new Map<string, StoredOTP>();

// OTP validity duration: 5 minutes
const OTP_TTL_MS = 5 * 60 * 1000;

/**
 * Generate a random 6-digit OTP string (zero-padded).
 */
export function generateOTP(): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
}

/**
 * Store an OTP in memory with a 5-minute expiry.
 * Overwrites any previous OTP for the same key.
 */
export function storeOTP(emailOrPhone: string, otp: string): void {
  const key = emailOrPhone.toLowerCase().trim();
  otpStore.set(key, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
  });
}

/**
 * Send an OTP to the given email or phone number.
 *
 * For MVP this simply logs the OTP to the console.
 * In production, integrate SMTP (e.g. Nodemailer + SES) or
 * SMS gateway (e.g. Twilio) here.
 */
export function sendOTP(emailOrPhone: string, otp: string): void {
  // Log clearly so devs can grab it from the terminal / Render logs
  log.info(`[OTP] Code for ${emailOrPhone}: ${otp}`);
  console.log(`\n========================================`);
  console.log(`  OTP for ${emailOrPhone}: ${otp}`);
  console.log(`  (valid for 5 minutes)`);
  console.log(`========================================\n`);
}

/**
 * Verify an OTP.
 * Returns true if the code matches and hasn't expired.
 * On successful verification the OTP is consumed (deleted).
 */
export function verifyOTP(emailOrPhone: string, otp: string): boolean {
  const key = emailOrPhone.toLowerCase().trim();
  const stored = otpStore.get(key);

  if (!stored) {
    return false;
  }

  // Expired?
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(key);
    return false;
  }

  // Mismatch?
  if (stored.otp !== otp) {
    return false;
  }

  // Valid — consume the OTP so it can't be reused
  otpStore.delete(key);
  return true;
}
