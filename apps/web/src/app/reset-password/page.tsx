'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api/client';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle } from 'lucide-react';

/**
 * Reset Password page.
 * Reads the reset token from URL search params (?token=...).
 * Allows user to set a new password.
 */
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Client-side validation: passwords must match
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      toast.success('Password reset successfully!');
      // Redirect to login after a short delay
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  // Show error if no token provided
  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-[#1c1b1b] mb-2">Invalid Reset Link</h1>
        <p className="text-[#78716c] mb-8">
          This password reset link is invalid or missing. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Request New Reset Link
        </Link>
      </div>
    );
  }

  return success ? (
    /* Success state */
    <div className="text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h1 className="text-3xl font-extrabold text-[#1c1b1b] mb-2">Password Reset!</h1>
      <p className="text-[#78716c] mb-8">
        Your password has been reset successfully. Redirecting you to sign in...
      </p>
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Go to Sign In
      </Link>
    </div>
  ) : (
    /* Password form */
    <>
      <h1 className="text-3xl font-extrabold text-[#1c1b1b] mb-2">Reset Password</h1>
      <p className="text-[#78716c] mb-8">
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="password" className="text-sm font-semibold text-[#1c1b1b]">New Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1.5 h-12 bg-white border-[#e7e5e4] rounded-lg focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[#1c1b1b]">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1.5 h-12 bg-white border-[#e7e5e4] rounded-lg focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-primary-600 text-white rounded-lg font-bold text-base hover:bg-primary-700 transition-colors active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#78716c]">
        Remember your password?{' '}
        <Link href="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
      </p>
    </>
  );
}

/**
 * Wrapper with Suspense boundary required for useSearchParams().
 */
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#a2382c] to-[#da6152] relative overflow-hidden flex-col justify-center px-16 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10">
          <Link href="/" className="text-2xl font-black tracking-tight mb-12 block">Crochet Hub</Link>
          <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
            Create a New<br />Password
          </h2>
          <p className="text-white/80 text-lg mb-12 max-w-md leading-relaxed">
            Choose a strong password to keep your account secure.
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-8 bg-[#fcf9f8]">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/" className="text-2xl font-black text-primary-600 tracking-tight">Crochet Hub</Link>
          </div>

          <Suspense fallback={<div className="text-center text-[#78716c]">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
