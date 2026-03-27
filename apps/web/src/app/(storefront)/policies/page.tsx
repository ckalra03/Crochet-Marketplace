import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

// -- SEO metadata for the Policies index page --
export const metadata: Metadata = {
  title: 'Policies — Crochet Hub',
  description:
    'Review Crochet Hub policies including returns & refunds, shipping, terms of service, and privacy.',
};

/**
 * Policy links — each card navigates to a dedicated policy page.
 */
const policies = [
  {
    slug: 'returns',
    title: 'Return & Refund Policy',
    description:
      'Understand our return windows, eligible reasons, and refund process for Ready Stock, MTO, and On-Demand items.',
  },
  {
    slug: 'shipping',
    title: 'Shipping Policy',
    description:
      'Learn about our centralized fulfillment, quality-check process, shipping timelines, and tracking information.',
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    description:
      'Platform rules, buyer and seller responsibilities, dispute resolution, and acceptable use guidelines.',
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    description:
      'How we collect, use, store, and protect your personal data, and your rights as a user.',
  },
] as const;

/**
 * Policies index page — static SSG, no data fetching.
 */
export default function PoliciesPage() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Policies</h1>
        <p className="mt-2 text-gray-600">
          Please review the following policies that govern your use of Crochet Hub.
        </p>

        {/* Policy cards grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {policies.map((policy) => (
            <Link key={policy.slug} href={`/policies/${policy.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">{policy.title}</CardTitle>
                  <CardDescription>{policy.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
