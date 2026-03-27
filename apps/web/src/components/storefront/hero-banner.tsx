'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

/**
 * HeroBanner - Full-width hero section for the storefront homepage.
 * Uses warm coral/rose gradient tones matching the Crochet Hub brand.
 * No external images - uses CSS gradients and decorative elements only.
 */
export function HeroBanner() {
  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden px-6 lg:px-12 bg-gradient-to-br from-[#ffdad5] via-[#ffe8e4] to-[#fcf9f8]">
      {/* Decorative background circles */}
      <div className="absolute top-[-80px] right-[-80px] w-[300px] h-[300px] rounded-full bg-[#f4978e]/15" />
      <div className="absolute bottom-[-60px] left-[-60px] w-[250px] h-[250px] rounded-full bg-[#fbb1a9]/10" />
      <div className="absolute top-1/2 right-1/4 w-[150px] h-[150px] rounded-full bg-[#f8ad9d]/10 hidden lg:block" />

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Left column - Copy and CTAs */}
        <div className="z-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-600/10 text-primary-600 font-bold text-xs uppercase tracking-widest mb-6">
            Handcrafted with Heart
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1c1b1b] leading-[1.1] mb-6 tracking-tight">
            Handcrafted with Love,{' '}
            <span className="text-primary-600">Delivered</span> with Care
          </h1>
          <p className="text-lg lg:text-xl text-[#78716c] max-w-lg mb-10 leading-relaxed">
            Your curated marketplace for quality-assured crochet creations.
            From cozy blankets to charming amigurumi, discover pieces made
            by passionate artisans across India.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/products">
              <button className="px-8 py-4 bg-primary-600 text-white rounded-full font-bold text-lg shadow-xl shadow-primary-600/20 hover:scale-105 transition-transform active:scale-95">
                Shop Now
              </button>
            </Link>
            <Link href="/on-demand/new">
              <button className="px-8 py-4 border-2 border-primary-600 text-primary-600 rounded-full font-bold text-lg flex items-center gap-2 hover:bg-primary-600/5 transition-colors">
                <Sparkles className="h-5 w-5" /> Custom Order
              </button>
            </Link>
          </div>
        </div>

        {/* Right column - Decorative yarn/crochet visual (CSS only) */}
        <div className="relative h-[300px] lg:h-[450px] hidden md:flex items-center justify-center">
          {/* Large decorative card */}
          <div className="absolute top-8 right-4 w-48 h-48 rounded-2xl bg-gradient-to-br from-primary-600/20 to-primary-600/5 border border-primary-600/10 rotate-6 flex items-center justify-center shadow-lg">
            <span className="text-6xl" role="img" aria-label="yarn">
              🧶
            </span>
          </div>
          {/* Medium decorative card */}
          <div className="absolute bottom-8 left-4 w-44 h-44 rounded-2xl bg-gradient-to-br from-[#fbb1a9]/30 to-[#fbb1a9]/5 border border-[#fbb1a9]/15 -rotate-6 flex items-center justify-center shadow-lg">
            <span className="text-5xl" role="img" aria-label="hook">
              🪡
            </span>
          </div>
          {/* Center decorative card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-3xl bg-white/80 backdrop-blur-sm border border-white shadow-2xl flex flex-col items-center justify-center gap-3 z-10">
            <span className="text-7xl" role="img" aria-label="teddy bear">
              🧸
            </span>
            <span className="text-sm font-bold text-[#78716c] tracking-wide uppercase">
              Made with Love
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
