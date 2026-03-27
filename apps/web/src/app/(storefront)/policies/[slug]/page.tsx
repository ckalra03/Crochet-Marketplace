import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// ---------------------------------------------------------------------------
// Policy content data — keeps everything co-located in one file.
// Each policy maps a slug to its title and body sections.
// ---------------------------------------------------------------------------

interface PolicySection {
  heading: string;
  body: string; // plain text (rendered inside <p> with whitespace-pre-line)
}

interface PolicyData {
  title: string;
  lastUpdated: string;
  description: string;
  sections: PolicySection[];
}

const policies: Record<string, PolicyData> = {
  /* ── Return & Refund Policy ── */
  returns: {
    title: 'Return & Refund Policy',
    lastUpdated: '2026-03-26',
    description:
      'Crochet Hub return and refund policy for Ready Stock, Made-to-Order, and On-Demand products.',
    sections: [
      {
        heading: 'Overview',
        body: 'Crochet Hub is committed to ensuring you receive quality handmade products. Because every item is a unique, handcrafted piece, our return policy varies by product type. All return requests must be submitted within 7 calendar days of receiving your order.',
      },
      {
        heading: 'Ready Stock Items',
        body: 'Ready Stock items are pre-made products that have already passed our quality-check inspection at the warehouse. Returns for Ready Stock items are accepted only for manufacturing defects — for example, broken stitches, incorrect sizing compared to the listing, significant color discrepancy, or damage during transit.\n\nPreference-based returns (e.g., "I changed my mind" or "the color doesn\'t match my expectations from the photos") are not eligible for Ready Stock items.',
      },
      {
        heading: 'Made-to-Order (MTO) Items',
        body: 'Made-to-Order items are crafted specifically for you after your order is placed. Because these are custom-produced, preference-based returns are not accepted.\n\nReturns are accepted only if the item has a manufacturing defect, does not match the specifications confirmed at order time, or arrives damaged. If you selected specific options (yarn color, size, pattern variation), the item must match those selections to be considered as delivered correctly.',
      },
      {
        heading: 'On-Demand Items',
        body: 'On-Demand items are fully custom pieces created from your personal request and a seller\'s accepted quote. Because these are bespoke products built to your exact requirements, preference-based returns are not accepted.\n\nReturns are eligible only for clear manufacturing defects or if the delivered item materially deviates from the agreed-upon quote specifications.',
      },
      {
        heading: 'Return Window & Process',
        body: 'You have 7 calendar days from the delivery date to submit a return request through your Crochet Hub account. To start a return:\n\n1. Go to My Orders and select the relevant order.\n2. Click "Request Return" and choose the affected item(s).\n3. Select a reason from the provided list.\n4. Upload photographic evidence showing the defect or issue.\n5. Submit your request.\n\nOur team will review your request within 2 business days. If approved, you will receive return shipping instructions.',
      },
      {
        heading: 'Evidence Requirements',
        body: 'All return requests must include clear photographs that demonstrate the issue. At minimum, please provide:\n\n- A full photo of the item as received.\n- Close-up photos of the defect or damage.\n- A photo of the shipping packaging (if claiming transit damage).\n\nRequests submitted without sufficient evidence may be delayed or denied.',
      },
      {
        heading: 'Refunds',
        body: 'Once we receive and verify the returned item at our warehouse, refunds are processed within 5 business days. Refunds are issued to your original payment method. Shipping costs are refunded only if the return is due to our error or a manufacturing defect.',
      },
    ],
  },

  /* ── Shipping Policy ── */
  shipping: {
    title: 'Shipping Policy',
    lastUpdated: '2026-03-26',
    description:
      'Crochet Hub shipping policy covering centralized fulfillment, quality checks, and delivery tracking.',
    sections: [
      {
        heading: 'Centralized Fulfillment',
        body: 'All Crochet Hub orders are processed through our centralized warehouse. Sellers ship their finished products to our facility, where our team inspects every item before it is dispatched to you. This centralized model ensures consistent quality and reliable packaging across all orders.',
      },
      {
        heading: 'Quality Check Before Dispatch',
        body: 'Before your order leaves our warehouse, it undergoes a quality-check (QC) inspection. Our team verifies:\n\n- Craftsmanship quality (stitch consistency, finishing)\n- Accuracy against the product listing or quote specifications\n- Correct sizing and color\n- Proper packaging to prevent damage during transit\n\nIf an item does not pass QC, we work with the seller to resolve the issue before shipping. You will be notified if this causes any delay.',
      },
      {
        heading: 'Shipping Timelines',
        body: 'Estimated delivery times depend on the product type:\n\n- Ready Stock: 3-7 business days after order placement.\n- Made-to-Order: Production time (varies by listing) plus 3-7 business days for QC and shipping.\n- On-Demand: Production time (as agreed in the accepted quote) plus 3-7 business days for QC and shipping.\n\nThese timelines are estimates. Actual delivery may vary based on your location and carrier performance.',
      },
      {
        heading: 'Tracking',
        body: 'Once your order has been dispatched from our warehouse, you will receive a tracking number via email and in your Crochet Hub account under My Orders. You can track your shipment in real time through the carrier\'s website.',
      },
      {
        heading: 'Shipping Coverage',
        body: 'We currently ship within Malaysia. Shipping costs are calculated at checkout based on package weight and destination. Free shipping promotions may be offered from time to time and will be clearly displayed on eligible products.',
      },
      {
        heading: 'Damaged or Lost Shipments',
        body: 'If your order arrives damaged or is lost in transit, please contact us within 7 days of the expected delivery date. We will work with the carrier to investigate and arrange a replacement or refund as appropriate.',
      },
    ],
  },

  /* ── Terms of Service ── */
  terms: {
    title: 'Terms of Service',
    lastUpdated: '2026-03-26',
    description:
      'Crochet Hub terms of service covering platform rules, responsibilities, and dispute resolution.',
    sections: [
      {
        heading: 'Acceptance of Terms',
        body: 'By accessing or using Crochet Hub, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform. We may update these terms from time to time, and continued use constitutes acceptance of any changes.',
      },
      {
        heading: 'Platform Overview',
        body: 'Crochet Hub is an online marketplace that connects crochet artisans (Sellers) with buyers (Buyers). We provide the technology platform, centralized quality-check fulfillment, and payment processing. We are not the manufacturer or direct seller of the products listed on the platform.',
      },
      {
        heading: 'Buyer Responsibilities',
        body: 'As a Buyer, you agree to:\n\n- Provide accurate delivery and contact information.\n- Review product descriptions, photos, and sizing before placing an order.\n- Submit return requests honestly and with valid evidence.\n- Not engage in fraudulent chargebacks or abuse of the return system.\n- Treat sellers and support staff with respect in all communications.',
      },
      {
        heading: 'Seller Responsibilities',
        body: 'As a Seller, you agree to:\n\n- Provide accurate and honest product listings, including photos, descriptions, sizing, and pricing.\n- Fulfill orders within the stated production timelines.\n- Ship products to our centralized warehouse promptly.\n- Maintain the quality standards expected by the platform.\n- Respond to buyer inquiries and dispute resolutions in a timely manner.\n- Comply with all applicable local laws and regulations regarding your products.',
      },
      {
        heading: 'Prohibited Content & Conduct',
        body: 'The following are prohibited on Crochet Hub:\n\n- Listing non-crochet or machine-manufactured items as handmade.\n- Counterfeit or trademarked designs without authorization.\n- Offensive, misleading, or fraudulent content.\n- Harassment or abusive behavior toward other users.\n- Attempting to circumvent platform fees by conducting transactions outside the platform.\n\nViolations may result in account suspension or permanent ban.',
      },
      {
        heading: 'Dispute Resolution',
        body: 'If a dispute arises between a Buyer and a Seller, Crochet Hub will act as a neutral mediator. Our dispute process:\n\n1. The Buyer submits a return or complaint through the platform.\n2. The Seller is notified and given an opportunity to respond.\n3. Our support team reviews evidence from both parties.\n4. A resolution is issued (refund, replacement, or claim denial).\n\nDecisions made by Crochet Hub in dispute resolution are final and binding for transactions conducted on the platform.',
      },
      {
        heading: 'Intellectual Property',
        body: 'All content on the Crochet Hub platform (logos, design, text, software) is owned by Crochet Hub or its licensors. Sellers retain ownership of their original crochet designs and product photos. By listing on the platform, sellers grant Crochet Hub a non-exclusive license to display their content for marketing and platform purposes.',
      },
      {
        heading: 'Limitation of Liability',
        body: 'Crochet Hub is a marketplace platform. We facilitate transactions but are not responsible for the quality of individual products beyond our QC inspection. Our liability is limited to the transaction value of the order in question. We are not liable for indirect, incidental, or consequential damages.',
      },
    ],
  },

  /* ── Privacy Policy ── */
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: '2026-03-26',
    description:
      'Crochet Hub privacy policy covering data collection, usage, storage, and your rights.',
    sections: [
      {
        heading: 'Information We Collect',
        body: 'We collect the following types of information:\n\n- Account Information: Name, email address, phone number, and password when you register.\n- Profile Information: Profile photo, bio, and address details you choose to provide.\n- Transaction Data: Order history, payment records, and delivery addresses.\n- Usage Data: Pages visited, features used, device type, browser, and IP address.\n- Communications: Messages sent through the platform and support tickets.',
      },
      {
        heading: 'How We Use Your Data',
        body: 'Your data is used to:\n\n- Provide and operate the Crochet Hub platform.\n- Process orders, payments, and refunds.\n- Communicate with you about orders, disputes, and account updates.\n- Improve our services and user experience through aggregated analytics.\n- Prevent fraud and enforce our Terms of Service.\n- Send optional marketing communications (only with your consent).',
      },
      {
        heading: 'Data Storage & Security',
        body: 'Your data is stored on secure servers with encryption at rest and in transit. We use industry-standard security measures including:\n\n- HTTPS encryption for all data transmission.\n- Hashed and salted passwords (never stored in plain text).\n- Role-based access control for internal systems.\n- Regular security audits and vulnerability assessments.\n\nWe retain your data for as long as your account is active, plus any period required by applicable law.',
      },
      {
        heading: 'Data Sharing',
        body: 'We do not sell your personal data. We share data only in these circumstances:\n\n- With Sellers: Your delivery name and address are shared with the relevant seller and our warehouse for order fulfillment.\n- With Payment Processors: Payment details are shared with our payment gateway to process transactions securely.\n- Legal Requirements: We may disclose data if required by law or to protect the rights and safety of our users and platform.',
      },
      {
        heading: 'Cookies & Tracking',
        body: 'Crochet Hub uses cookies and similar technologies to:\n\n- Keep you logged in across sessions.\n- Remember your cart contents and preferences.\n- Collect anonymous usage analytics to improve the platform.\n\nYou can control cookie settings through your browser. Disabling cookies may affect platform functionality.',
      },
      {
        heading: 'Your Rights',
        body: 'Depending on your jurisdiction, you may have the right to:\n\n- Access the personal data we hold about you.\n- Request correction of inaccurate data.\n- Request deletion of your account and associated data.\n- Withdraw consent for marketing communications at any time.\n- Export your data in a portable format.\n\nTo exercise any of these rights, contact us at privacy@crochethub.com.',
      },
      {
        heading: 'Changes to This Policy',
        body: 'We may update this Privacy Policy from time to time. When we make material changes, we will notify you via email or a prominent notice on the platform. Continued use of Crochet Hub after changes constitutes acceptance of the updated policy.',
      },
    ],
  },
};

// -- Valid slugs for static generation --
const validSlugs = ['returns', 'shipping', 'terms', 'privacy'] as const;

/**
 * Pre-generate all four policy pages at build time (SSG).
 */
export function generateStaticParams() {
  return validSlugs.map((slug) => ({ slug }));
}

/**
 * Dynamic SEO metadata per policy page.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) return { title: 'Policy Not Found — Crochet Hub' };

  return {
    title: `${policy.title} — Crochet Hub`,
    description: policy.description,
  };
}

/**
 * Individual policy page — renders prose-style content from the policies map.
 */
export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = policies[slug];

  // 404 if slug is not recognized
  if (!policy) notFound();

  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-gray-500">
          <Link href="/policies" className="hover:text-gray-700 hover:underline">
            Policies
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{policy.title}</span>
        </nav>

        {/* Title & last-updated */}
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {policy.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Last updated: {policy.lastUpdated}
        </p>

        {/* Policy sections — prose-style readable content */}
        <article className="mt-10 space-y-8">
          {policy.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-xl font-semibold text-gray-900">
                {section.heading}
              </h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-600">
                {section.body}
              </p>
            </div>
          ))}
        </article>

        {/* Back link */}
        <div className="mt-12 border-t pt-6">
          <Link
            href="/policies"
            className="text-sm font-medium text-pink-600 hover:text-pink-700 hover:underline"
          >
            Back to all policies
          </Link>
        </div>
      </div>
    </section>
  );
}
