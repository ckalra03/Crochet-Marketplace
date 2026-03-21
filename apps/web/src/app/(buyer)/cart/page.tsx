'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import api from '@/lib/api/client';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  quantity: number;
  product: { id: string; name: string; slug: string; priceInCents: number; productType: string; sellerProfile?: { businessName: string } };
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalInCents, setTotalInCents] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchCart() {
    try {
      const { data } = await api.get('/cart');
      setItems(data.items);
      setTotalInCents(data.totalInCents);
    } catch {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCart(); }, []);

  async function updateQuantity(itemId: string, quantity: number) {
    try {
      if (quantity <= 0) {
        await api.delete(`/cart/items/${itemId}`);
      } else {
        await api.put(`/cart/items/${itemId}`, { quantity });
      }
      fetchCart();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  }

  async function removeItem(itemId: string) {
    try {
      await api.delete(`/cart/items/${itemId}`);
      fetchCart();
      toast.success('Item removed');
    } catch {
      toast.error('Failed to remove');
    }
  }

  if (loading) return <div className="container mx-auto px-4 py-20 text-center">Loading cart...</div>;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add some beautiful crochet items!</p>
        <Link href="/products"><Button>Browse Products</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart ({items.length} items)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-20 h-20 bg-muted rounded flex items-center justify-center shrink-0">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.slug}`} className="font-semibold text-sm hover:text-primary-600 line-clamp-1">
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{item.product.sellerProfile?.businessName}</p>
                  <p className="font-bold text-primary-600 mt-1">₹{(item.product.priceInCents / 100).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center border rounded-md">
                  <button className="px-2 py-1 hover:bg-muted" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></button>
                  <span className="px-3 text-sm">{item.quantity}</span>
                  <button className="px-2 py-1 hover:bg-muted" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></button>
                </div>
                <p className="font-bold text-sm w-24 text-right">₹{((item.product.priceInCents * item.quantity) / 100).toLocaleString('en-IN')}</p>
                <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="h-fit sticky top-20">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{(totalInCents / 100).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-green-600">Free</span></div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary-600">₹{(totalInCents / 100).toLocaleString('en-IN')}</span></div>
            </div>
            <Link href="/checkout">
              <Button className="w-full mt-6 gap-2" size="lg">
                Checkout <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
