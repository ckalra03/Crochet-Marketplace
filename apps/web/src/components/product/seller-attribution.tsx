import Link from 'next/link';
import { Star } from 'lucide-react';

interface SellerAttributionProps {
  seller: { businessName: string; id: string };
  /** Average rating (0-5). Omit to hide the rating display. */
  rating?: number;
  /** Total number of reviews. */
  reviewCount?: number;
}

/**
 * Displays the seller's business name with an avatar initial,
 * optional star rating, and a link to browse their products.
 */
export function SellerAttribution({ seller, rating, reviewCount }: SellerAttributionProps) {
  // First letter of the business name as avatar
  const initial = seller.businessName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Avatar initial */}
      <div className="w-9 h-9 rounded-full bg-primary-600/10 flex items-center justify-center text-primary-600 font-bold text-sm">
        {initial}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-[#78716c]">by</span>
        <Link
          href={`/products?sellerId=${seller.id}`}
          className="font-semibold text-[#1c1b1b] hover:text-primary-600 transition-colors"
        >
          {seller.businessName}
        </Link>

        {/* Rating display */}
        {typeof rating === 'number' && rating > 0 && (
          <span className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-bold">{rating.toFixed(1)}</span>
            {typeof reviewCount === 'number' && (
              <span className="text-[#78716c]">({reviewCount} reviews)</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
