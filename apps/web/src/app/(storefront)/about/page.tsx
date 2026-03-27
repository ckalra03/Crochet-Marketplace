import type { Metadata } from 'next';
import Link from 'next/link';

// -- SEO metadata for the About page --
export const metadata: Metadata = {
  title: 'About Crochet Hub — Handmade Crochet Marketplace',
  description:
    'Learn about Crochet Hub, the curated marketplace connecting talented crochet artisans with buyers who appreciate quality handmade goods.',
};

/**
 * About Crochet Hub — static SSG page.
 * No data fetching; rendered at build time.
 */
export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero Section ── */}
      <section className="bg-gradient-to-b from-pink-50 to-white py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            About Crochet Hub
          </h1>
          <p className="mt-4 text-lg text-gray-600 sm:text-xl">
            The curated marketplace where handmade crochet meets quality assurance.
          </p>
        </div>
      </section>

      {/* ── Mission Statement ── */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl font-semibold text-gray-900">Our Mission</h2>
          <p className="mt-4 leading-relaxed text-gray-600">
            Crochet Hub exists to support artisan crochet makers by providing a dedicated
            platform where their craft is valued, showcased, and delivered with care. We
            believe every hand-stitched piece tells a story, and our mission is to connect
            those stories with people who appreciate authentic, handmade quality.
          </p>
          <p className="mt-4 leading-relaxed text-gray-600">
            Unlike generic marketplaces, we focus exclusively on crochet — giving artisans
            the visibility they deserve and giving buyers the confidence that every item has
            been reviewed for quality before it ships.
          </p>
        </div>
      </section>

      {/* ── How It Works (3 steps) ── */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-semibold text-gray-900">How It Works</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-2xl font-bold text-pink-600">
                1
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Browse</h3>
              <p className="mt-2 text-sm text-gray-600">
                Explore our curated catalog of ready-stock, made-to-order, and on-demand
                crochet products from verified artisans.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-2xl font-bold text-pink-600">
                2
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Order</h3>
              <p className="mt-2 text-sm text-gray-600">
                Place your order with secure checkout. For on-demand items, submit a custom
                request and receive quotes from qualified makers.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-2xl font-bold text-pink-600">
                3
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Receive</h3>
              <p className="mt-2 text-sm text-gray-600">
                Every item passes through our quality-check process at the central warehouse
                before being dispatched to you with tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Crochet Hub ── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-semibold text-gray-900">
            Why Crochet Hub?
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {/* Quality Assured */}
            <div className="rounded-lg border p-6">
              <h3 className="text-lg font-medium text-gray-900">Quality Assured</h3>
              <p className="mt-2 text-sm text-gray-600">
                Every product is inspected at our centralized fulfillment center before it
                reaches you. We check for craftsmanship, accuracy, and packaging quality.
              </p>
            </div>

            {/* Supporting Artisans */}
            <div className="rounded-lg border p-6">
              <h3 className="text-lg font-medium text-gray-900">Supporting Artisans</h3>
              <p className="mt-2 text-sm text-gray-600">
                We provide crochet makers with tools, visibility, and fair compensation so
                they can focus on what they do best — creating beautiful handmade pieces.
              </p>
            </div>

            {/* Curated Selection */}
            <div className="rounded-lg border p-6">
              <h3 className="text-lg font-medium text-gray-900">Curated Selection</h3>
              <p className="mt-2 text-sm text-gray-600">
                Our catalog is thoughtfully organized by category, style, and availability
                type so you can find the perfect crochet piece quickly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Team & Values ── */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl font-semibold text-gray-900">Our Values</h2>
          <ul className="mt-6 space-y-4 text-gray-600">
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-pink-500" />
              <span>
                <strong className="text-gray-900">Craftsmanship First</strong> — We celebrate
                the skill and patience behind every stitch.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-pink-500" />
              <span>
                <strong className="text-gray-900">Transparency</strong> — Clear pricing, honest
                timelines, and open communication between buyers and sellers.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-pink-500" />
              <span>
                <strong className="text-gray-900">Community</strong> — We are building a
                supportive ecosystem where artisans grow together with their customers.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-pink-500" />
              <span>
                <strong className="text-gray-900">Sustainability</strong> — Handmade goods last
                longer and carry meaning. We champion slow, intentional consumption.
              </span>
            </li>
          </ul>

          {/* CTA */}
          <div className="mt-10 text-center">
            <Link
              href="/policies"
              className="text-sm font-medium text-pink-600 underline underline-offset-4 hover:text-pink-700"
            >
              Read our policies
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
