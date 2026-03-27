'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api/client';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';

/**
 * Forgot Password page.
 * Accepts an email address and calls the forgot-password API.
 * Always shows a generic success message to avoid leaking user existence.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err: any) {
      // Even on error, show success to avoid leaking info
      // Only show error for network/rate-limit issues
      if (err.response?.status === 429) {
        toast.error('Too many attempts. Please try again later.');
      } else {
        setSubmitted(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Brand Panel (matches login page) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#a2382c] to-[#da6152] relative overflow-hidden flex-col justify-center px-16 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10">
          <Link href="/" className="text-2xl font-black tracking-tight mb-12 block">Crochet Hub</Link>
          <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
            Reset Your<br />Password
          </h2>
          <p className="text-white/80 text-lg mb-12 max-w-md leading-relaxed">
            No worries! Enter your email and we will send you instructions to reset your password.
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-8 bg-[#fcf9f8]">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/" className="text-2xl font-black text-primary-600 tracking-tight">Crochet Hub</Link>
          </div>

          {submitted ? (
            /* Success state — shown after form submission */
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-extrabold text-[#1c1b1b] mb-2">Check Your Email</h1>
              <p className="text-[#78716c] mb-8">
                If an account exists with that email, you&apos;ll receive a reset link.
                Please check your inbox and spam folder.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            /* Email input form */
            <>
              <h1 className="text-3xl font-extrabold text-[#1c1b1b] mb-2">Forgot Password</h1>
              <p className="text-[#78716c] mb-8">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-sm font-semibold text-[#1c1b1b]">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1.5 h-12 bg-white border-[#e7e5e4] rounded-lg focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary-600 text-white rounded-lg font-bold text-base hover:bg-primary-700 transition-colors active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-[#78716c]">
                Remember your password?{' '}
                <Link href="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
