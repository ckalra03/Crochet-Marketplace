'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import api from '@/lib/api/client';
import { toast } from 'sonner';

export function AddToCartButton({ productId, disabled }: { productId: string; disabled?: boolean }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  async function handleAddToCart() {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      await api.post('/cart/items', { productId, quantity });
      toast.success('Added to cart!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center border rounded-md">
        <button
          className="px-3 py-2 hover:bg-muted transition-colors"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">{quantity}</span>
        <button
          className="px-3 py-2 hover:bg-muted transition-colors"
          onClick={() => setQuantity(quantity + 1)}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <Button size="lg" onClick={handleAddToCart} disabled={disabled || loading} className="gap-2 flex-1">
        <ShoppingCart className="h-5 w-5" />
        {disabled ? 'Out of Stock' : loading ? 'Adding...' : 'Add to Cart'}
      </Button>
    </div>
  );
}
