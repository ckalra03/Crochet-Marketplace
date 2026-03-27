'use client';

/**
 * ReviewForm -- Combined rating + review form for a single order item.
 *
 * Uses StarRatingInput for score selection and a Textarea for optional review text.
 * Submits via useSubmitRating() mutation hook.
 */

import { useState } from 'react';
import { z } from 'zod';
import { useSubmitRating } from '@/lib/hooks/use-ratings';
import { StarRatingInput } from '@/components/ratings/star-rating-input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';

/* ───────────── Validation schema ───────────── */

const reviewSchema = z.object({
  score: z.number().min(1, 'Please select a rating').max(5),
  review: z.string().optional(),
});

/* ───────────── Component ───────────── */

interface ReviewFormProps {
  /** Order number this rating belongs to */
  orderNumber: string;
  /** Specific order item being rated */
  orderItemId: string;
  /** Product name to display in the form header */
  productName?: string;
}

function ReviewForm({ orderNumber, orderItemId, productName }: ReviewFormProps) {
  const submitRating = useSubmitRating();

  const [score, setScore] = useState(0);
  const [review, setReview] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = reviewSchema.safeParse({
      score,
      review: review.trim() || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    submitRating.mutate(
      {
        orderNumber,
        orderItemId,
        data: parsed.data,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message ?? 'Failed to submit rating. Please try again.';
          setError(message);
        },
      },
    );
  };

  // Show success state after submission
  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-4">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <p className="text-sm text-green-800">
          Thank you! Your review for {productName ?? 'this item'} has been submitted.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {productName && (
        <p className="font-medium text-sm">{productName}</p>
      )}

      {/* Star rating */}
      <div className="space-y-1">
        <Label>Rating</Label>
        <StarRatingInput
          value={score}
          onChange={setScore}
          disabled={submitRating.isPending}
        />
      </div>

      {/* Review text */}
      <div className="space-y-1">
        <Label htmlFor={`review-${orderItemId}`}>Review (optional)</Label>
        <Textarea
          id={`review-${orderItemId}`}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={3}
          disabled={submitRating.isPending}
        />
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Submit */}
      <Button type="submit" size="sm" disabled={submitRating.isPending}>
        {submitRating.isPending ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
}

export { ReviewForm };
export type { ReviewFormProps };
