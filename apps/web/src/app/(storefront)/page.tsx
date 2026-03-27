import { HeroBanner } from '@/components/storefront/hero-banner';
import { CategoryCards } from '@/components/storefront/category-cards';
import { FeaturedProducts } from '@/components/storefront/featured-products';
import { HowItWorks } from '@/components/storefront/how-it-works';
import { SellerCTA } from '@/components/storefront/seller-cta';

/**
 * HomePage - Server component shell that composes all storefront sections.
 * Order: HeroBanner -> CategoryCards -> FeaturedProducts -> HowItWorks -> SellerCTA
 *
 * Data fetching is handled inside each client component via React Query hooks,
 * giving us loading states, caching, and automatic revalidation for free.
 */
export default function HomePage() {
  return (
    <div className="bg-[#fcf9f8]">
      <HeroBanner />
      <CategoryCards />
      <FeaturedProducts />
      <HowItWorks />
      <SellerCTA />
    </div>
  );
}
