'use client';

import { Search, ShoppingCart, Package } from 'lucide-react';

/**
 * HowItWorks - 3-step visual guide explaining the buying process.
 * Steps: Browse -> Order -> Receive
 * Horizontal on desktop, vertical on mobile. Uses Lucide icons.
 */

const STEPS = [
  {
    icon: Search,
    title: 'Browse',
    description:
      'Explore our curated collection of handmade crochet products from verified artisans across India.',
  },
  {
    icon: ShoppingCart,
    title: 'Order',
    description:
      'Add to cart and checkout securely. Choose ready-stock items or place a custom made-to-order request.',
  },
  {
    icon: Package,
    title: 'Receive',
    description:
      'Every item is quality-checked at our hub before being shipped to your doorstep with tracking.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 max-w-7xl mx-auto px-6">
      {/* Section heading */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-[#1c1b1b] mb-3">
          How It Works
        </h2>
        <p className="text-[#78716c] max-w-md mx-auto">
          Getting your favourite crochet piece is simple
        </p>
      </div>

      {/* Steps grid: vertical stack on mobile, horizontal row on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="flex flex-col items-center text-center">
              {/* Step number and icon */}
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-primary-600/10 flex items-center justify-center">
                  <Icon className="h-9 w-9 text-primary-600" />
                </div>
                {/* Step number badge */}
                <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                  {idx + 1}
                </span>
              </div>

              {/* Step title and description */}
              <h3 className="text-xl font-bold text-[#1c1b1b] mb-2">{step.title}</h3>
              <p className="text-[#78716c] text-sm leading-relaxed max-w-xs">
                {step.description}
              </p>

              {/* Connector arrow (only between steps on desktop) */}
              {idx < STEPS.length - 1 && (
                <div className="hidden md:block absolute" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
