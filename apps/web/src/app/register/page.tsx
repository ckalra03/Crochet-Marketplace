'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/stores/auth-store';
import api from '@/lib/api/client';
import { toast } from 'sonner';
import { Shield, Package, Star } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name, email: form.email, password: form.password,
      });
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Account created! Welcome to Crochet Hub');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#a2382c] to-[#da6152] relative overflow-hidden flex-col justify-center px-16 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
        <div className="relative z-10">
          <Link href="/" className="text-2xl font-black tracking-tight mb-12 block">Crochet Hub</Link>
          <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
            Join the<br />Crochet Community
          </h2>
          <p className="text-white/80 text-lg mb-12 max-w-md leading-relaxed">
            Create your account and start exploring unique handmade crochet treasures.
          </p>
          <div className="flex gap-8">
            {[
              { icon: <Package className="h-5 w-5" />, label: '1000+ Products' },
              { icon: <Star className="h-5 w-5" />, label: '50+ Artisans' },
              { icon: <Shield className="h-5 w-5" />, label: 'Quality Assured' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 text-white/90">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">{stat.icon}</div>
                <span className="text-sm font-semibold">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-8 bg-[#fcf9f8]">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/" className="text-2xl font-black text-primary-600 tracking-tight">Crochet Hub</Link>
          </div>
          <h1 className="text-3xl font-extrabold text-[#1c1b1b] mb-2">Create Account</h1>
          <p className="text-[#78716c] mb-8">Join Crochet Hub to discover handmade treasures</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-semibold text-[#1c1b1b]">Full Name</Label>
              <Input id="name" placeholder="Your name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2}
                className="mt-1.5 h-12 bg-white border-[#e7e5e4] rounded-lg" />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-[#1c1b1b]">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required
                className="mt-1.5 h-12 bg-white border-[#e7e5e4] rounded-lg" />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-semibold text-[#1c1b1b]">Password</Label>
              <Input id="password" type="password" placeholder="Min 8 characters" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8}
                className="mt-1.5 h-12 bg-white border-[#e7e5e4] rounded-lg" />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[#1c1b1b]">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="Confirm password" value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required
                className="mt-1.5 h-12 bg-white border-[#e7e5e4] rounded-lg" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-12 bg-primary-600 text-white rounded-lg font-bold text-base hover:bg-primary-700 transition-colors active:scale-[0.98] disabled:opacity-60">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#78716c]">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
