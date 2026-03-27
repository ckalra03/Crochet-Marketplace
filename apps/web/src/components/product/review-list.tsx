import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils/format';

interface Rating {
  score: number;
  review: string;
  user: { name: string };
  createdAt: string;
}

interface ReviewListProps {
  ratings: Rating[];
  /** Pre-computed average rating (saves recalculating from the array). */
  avgRating?: number;
}

/** Renders a row of filled/empty stars for the given score (out of 5). */
function StarRating({ score, size = 'sm' }: { score: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'md' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  return (
    <div className="flex" aria-label={`${score} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i < Math.round(score)
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Displays a list of product reviews with an average-rating summary.
 * Shows a friendly "No reviews yet" message when the list is empty.
 */
export function ReviewList({ ratings, avgRating }: ReviewListProps) {
  // Nothing to display
  if (!ratings || ratings.length === 0) {
    return (
      <section className="mt-16 pb-8">
        <h2 className="text-2xl font-extrabold text-[#1c1b1b] mb-4">Customer Reviews</h2>
        <p className="text-[#78716c]">No reviews yet. Be the first to share your experience!</p>
      </section>
    );
  }

  // Compute average if not provided
  const avg =
    avgRating ??
    ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;

  return (
    <section className="mt-16 pb-8">
      <h2 className="text-2xl font-extrabold text-[#1c1b1b] mb-2">Customer Reviews</h2>

      {/* ── Average rating summary ───────────────────────────────── */}
      <div className="flex items-center gap-2 mb-8">
        <StarRating score={avg} size="md" />
        <span className="font-bold text-lg">{avg.toFixed(1)}</span>
        <span className="text-[#78716c]">({ratings.length} review{ratings.length !== 1 ? 's' : ''})</span>
      </div>

      {/* ── Individual reviews ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ratings.map((rating, idx) => (
          <Card key={idx} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                {/* Reviewer avatar initial */}
                <div className="w-10 h-10 rounded-full bg-primary-600/10 flex items-center justify-center text-primary-600 font-bold text-sm">
                  {rating.user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-sm">{rating.user?.name || 'Anonymous'}</p>
                  <div className="flex items-center gap-2">
                    <StarRating score={rating.score} />
                    {rating.createdAt && (
                      <span className="text-xs text-[#78716c]">{formatDate(rating.createdAt)}</span>
                    )}
                  </div>
                </div>
              </div>
              {rating.review && (
                <p className="text-sm text-[#78716c] leading-relaxed">{rating.review}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
