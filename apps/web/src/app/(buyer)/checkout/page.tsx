'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck } from 'lucide-react';
import api from '@/lib/api/client';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [policyAcknowledged, setPolicyAcknowledged] = useState(false);
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [cartRes, addrRes] = await Promise.all([
          api.get('/cart'),
          api.get('/profile/addresses'),
        ]);
        setCart(cartRes.data);
        setAddresses(addrRes.data);
        const defaultAddr = addrRes.data.find((a: any) => a.isDefault) || addrRes.data[0];
        if (defaultAddr) setSelectedAddress(defaultAddr.id);
      } catch {
        toast.error('Failed to load checkout data');
      }
    }
    load();
  }, []);

  async function handleCheckout() {
    if (!selectedAddress) { toast.error('Please select a shipping address'); return; }
    if (!policyAcknowledged) { toast.error('Please acknowledge the return policy'); return; }

    setLoading(true);
    try {
      const { data } = await api.post('/checkout', {
        shippingAddressId: selectedAddress,
        policyAcknowledged: true,
        notes,
      });
      toast.success(`Order ${data.orderNumber} placed!`);
      router.push(`/orders/${data.orderNumber}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  if (!cart) return <div className="container mx-auto px-4 py-20 text-center">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {/* Address */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg">Shipping Address</CardTitle></CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <p className="text-muted-foreground text-sm">No addresses found. Please add one in your profile.</p>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr: any) => (
                <label key={addr.id} className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer ${selectedAddress === addr.id ? 'border-primary-600 bg-primary-50' : ''}`}>
                  <input type="radio" name="address" value={addr.id} checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-1" />
                  <div>
                    <p className="font-medium text-sm">{addr.label || 'Address'}</p>
                    <p className="text-sm text-muted-foreground">{addr.line1}, {addr.city}, {addr.state} {addr.postalCode}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg">Order Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cart.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.product.name} x {item.quantity}</span>
                <span>₹{((item.product.priceInCents * item.quantity) / 100).toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary-600">₹{(cart.totalInCents / 100).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Label htmlFor="notes">Order Notes (optional)</Label>
          <Input id="notes" placeholder="Any special instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2" />
        </CardContent>
      </Card>

      {/* Policy */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={policyAcknowledged} onChange={(e) => setPolicyAcknowledged(e.target.checked)} className="mt-1" />
            <div>
              <p className="text-sm font-medium flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-blue-600" /> Return Policy Acknowledgment
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                I understand that Made-to-Order and Custom items are non-returnable except for defects, wrong items, or transit damage.
                Ready Stock items accept defect-only returns within 7 days.
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      <Button size="lg" className="w-full" onClick={handleCheckout} disabled={loading || !policyAcknowledged}>
        {loading ? 'Processing...' : `Place Order — ₹${(cart.totalInCents / 100).toLocaleString('en-IN')}`}
      </Button>
    </div>
  );
}
