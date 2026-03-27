'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';

/**
 * SellerCTA - Call-to-action section encouraging artisans to join as sellers.
 * Lists key benefits and links to the seller registration page.
 */

const BENEFITS = [
  'Reach thousands of crochet lovers across India',
  'Quality-assured fulfillment handled by Crochet Hub',
  'Transparent payouts with seller dashboard',
  'Support for ready-stock and made-to-order products',
];

export function SellerCTA() {
  return (
    <section className="relative py-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto bg-primary-600 rounded-[2rem] px-8 md:px-16 py-16 md:py-20 relative z-10 overflow-hidden shadow-2xl">
        {/* Decorative background circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
          {/* Left: Heading and benefits */}
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
              Become a Seller
            </h2>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              Are you a crochet artist? Join our marketplace and share your
              craftsmanship with a community that values handmade.
            </p>
            <ul className="space-y-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-white/90 text-sm">
                  <Check className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: CTA button */}
          <div className="flex md:justify-center">
            <Link href="/seller/register">
              <button className="bg-white text-primary-700 px-10 py-4 rounded-full font-extrabold text-lg shadow-xl hover:scale-105 transition-transform active:scale-95">
                Start Selling
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
