'use client';

import { useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAddToWishlist, useRemoveFromWishlist, useWishlistIds } from '@/lib/hooks/use-wishlist';
import { useAuthStore } from '@/lib/stores/auth-store';

interface WishlistButtonProps {
  productId: string;
  /** Optional className for custom styling. */
  className?: string;
}

/**
 * WishlistButton -- heart icon that toggles wishlist status.
 *
 * - Red filled heart when wishlisted, outline when not.
 * - Optimistic update: toggles immediately, rolls back on error.
 * - Shows toast to log in if user is not authenticated.
 */
export function WishlistButton({ productId, className }: WishlistButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const { data: wishlistIds } = useWishlistIds();
  const addMutation = useAddToWishlist();
  const removeMutation = useRemoveFromWishlist();

  // Optimistic local state: tracks whether we've locally toggled
  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  const isWishlisted = optimistic !== null
    ? optimistic
    : (wishlistIds?.has(productId) ?? false);

  const isLoading = addMutation.isPending || removeMutation.isPending;

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      // Prevent bubbling to parent link (e.g., ProductCard wraps in <Link>)
      e.preventDefault();
      e.stopPropagation();

      if (!isAuthenticated) {
        toast.error('Please log in to add items to your wishlist');
        return;
      }

      if (isWishlisted) {
        // Optimistic: remove immediately
        setOptimistic(false);
        removeMutation.mutate(productId, {
          onSuccess: () => setOptimistic(null),
          onError: () => {
            setOptimistic(null);
            toast.error('Failed to remove from wishlist');
          },
        });
      } else {
        // Optimistic: add immediately
        setOptimistic(true);
        addMutation.mutate(productId, {
          onSuccess: () => setOptimistic(null),
          onError: () => {
            setOptimistic(null);
            toast.error('Failed to add to wishlist');
          },
        });
      }
    },
    [isAuthenticated, isWishlisted, productId, addMutation, removeMutation],
  );

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          isWishlisted
            ? 'fill-red-500 text-red-500'
            : 'fill-none text-gray-500 hover:text-red-400'
        }`}
      />
    </Button>
  );
}
