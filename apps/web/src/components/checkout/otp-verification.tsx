'use client';

/**
 * OTP Verification Component
 *
 * Used on the checkout and on-demand pages for guest users.
 * Flow: enter email -> send OTP -> enter 6-digit code -> verify -> auto-logged in.
 *
 * On successful verification the auth store is updated with tokens,
 * which triggers re-renders so the parent page shows the authenticated flow.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useSendOTP, useVerifyOTP } from '@/lib/hooks/use-auth';
import { toast } from 'sonner';

interface OTPVerificationProps {
  /** Title shown at the top of the card */
  title?: string;
  /** Description shown under the title */
  description?: string;
}

// Resend cooldown in seconds
const RESEND_COOLDOWN = 30;

export function OTPVerification({
  title = 'Verify Your Email to Continue',
  description = 'Enter your email address and we will send you a one-time verification code.',
}: OTPVerificationProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const sendOTPMutation = useSendOTP();
  const verifyOTPMutation = useVerifyOTP();

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Send OTP to the entered email
  const handleSendOTP = useCallback(() => {
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    // Basic email format check
    if (!email.includes('@') || !email.includes('.')) {
      toast.error('Please enter a valid email address');
      return;
    }

    sendOTPMutation.mutate(email.trim(), {
      onSuccess: () => {
        setOtpSent(true);
        setCountdown(RESEND_COOLDOWN);
        toast.success('OTP sent! Check your email (or server console in dev mode).');
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error || 'Failed to send OTP');
      },
    });
  }, [email, sendOTPMutation]);

  // Verify the OTP code
  const handleVerifyOTP = useCallback(() => {
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    // Pass sessionId so the backend can merge the guest cart
    const sessionId = typeof window !== 'undefined'
      ? localStorage.getItem('sessionId') || undefined
      : undefined;

    verifyOTPMutation.mutate(
      { emailOrPhone: email.trim(), otp, sessionId },
      {
        onSuccess: () => {
          toast.success('Verified! You are now logged in.');
          // Auth store is updated by the hook — parent component re-renders
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.error || 'Invalid or expired OTP');
        },
      },
    );
  }, [email, otp, verifyOTPMutation]);

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
          {otpSent ? (
            <ShieldCheck className="h-6 w-6 text-primary-600" />
          ) : (
            <Mail className="h-6 w-6 text-primary-600" />
          )}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Email input — always visible */}
        <div className="space-y-2">
          <Label htmlFor="otp-email">Email Address</Label>
          <Input
            id="otp-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={otpSent}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !otpSent) handleSendOTP();
            }}
          />
        </div>

        {/* Before OTP is sent: show Send OTP button */}
        {!otpSent && (
          <Button
            className="w-full"
            onClick={handleSendOTP}
            disabled={sendOTPMutation.isPending || !email.trim()}
          >
            {sendOTPMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send OTP'
            )}
          </Button>
        )}

        {/* After OTP is sent: show OTP input + verify button */}
        {otpSent && (
          <>
            <div className="space-y-2">
              <Label htmlFor="otp-code">Verification Code</Label>
              <Input
                id="otp-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => {
                  // Only allow digits
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVerifyOTP();
                }}
                autoFocus
                className="text-center text-lg tracking-widest"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleVerifyOTP}
              disabled={verifyOTPMutation.isPending || otp.length !== 6}
            >
              {verifyOTPMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </Button>

            {/* Resend button with countdown */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Resend OTP in {countdown}s
                </p>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSendOTP}
                  disabled={sendOTPMutation.isPending}
                >
                  Resend OTP
                </Button>
              )}
            </div>

            {/* Let user change email */}
            <div className="text-center">
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                }}
              >
                Use a different email
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
