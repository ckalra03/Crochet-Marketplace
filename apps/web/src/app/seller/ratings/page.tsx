'use client';

/**
 * Seller Ratings Page
 *
 * Displays ratings received by the seller:
 * - Average rating summary at top
 * - Cards showing: buyer name, product name, star rating, review text, date
 * - Empty state when no ratings exist
 */

import { useMemo } from 'react';
import { Star } from 'lucide-react';

import { useSellerRatings } from '@/lib/hooks/use-seller';
import { formatDate } from '@/lib/utils/format';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SellerRatingsPage() {
  const { data, isLoading } = useSellerRatings();
  const ratings: any[] = data?.ratings ?? data ?? [];

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (ratings.length === 0) return 0;
    const total = ratings.reduce((sum: number, r: any) => sum + (r.score ?? r.rating ?? 0), 0);
    return total / ratings.length;
  }, [ratings]);

  if (isLoading) return <RatingsLoadingSkeleton />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Ratings</h1>

      {/* Average rating summary */}
      {ratings.length > 0 && (
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
            <div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Based on {ratings.length} rating{ratings.length !== 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating cards or empty state */}
      {ratings.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {ratings.map((rating: any) => (
            <RatingCard key={rating.id} rating={rating} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

/** Single rating card. */
function RatingCard({ rating }: { rating: any }) {
  const score = rating.score ?? rating.rating ?? 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Buyer name and product */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">
                {rating.buyerName ?? rating.buyer?.name ?? 'Anonymous'}
              </span>
              <span className="text-muted-foreground text-xs">
                {rating.createdAt ? formatDate(rating.createdAt) : ''}
              </span>
            </div>
            {rating.productName && (
              <p className="text-xs text-muted-foreground mb-2">
                Product: {rating.productName}
              </p>
            )}

            {/* Star rating display */}
            <div className="flex items-center gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Review text */}
            {rating.review && (
              <p className="text-sm text-muted-foreground">{rating.review}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Empty state when there are no ratings. */
function EmptyState() {
  return (
    <div className="text-center py-20">
      <Star className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">No ratings yet</h2>
      <p className="text-muted-foreground">
        Ratings from buyers will appear here after orders are delivered.
      </p>
    </div>
  );
}

/** Loading skeleton. */
function RatingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-24 w-full rounded-lg" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-lg" />
      ))}
    </div>
  );
}
