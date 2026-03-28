'use client';

/**
 * Checkout page with guest OTP verification support.
 *
 * If NOT authenticated:
 *   Shows OTP verification form first. After the guest verifies their email,
 *   they are auto-registered/logged in, the cart merges, and the page
 *   re-renders with the standard checkout flow.
 *
 * If authenticated:
 *   Step 1: Select or add a shipping address
 *   Step 2: Review order summary and acknowledge return policy
 *   Step 3: Simulated payment / place order
 *
 * On success, redirects to /orders/{orderNumber}/confirmation.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AddressSelector } from '@/components/checkout/address-selector';
import { OrderSummary } from '@/components/checkout/order-summary';
import { PaymentSection } from '@/components/checkout/payment-section';
import { OTPVerification } from '@/components/checkout/otp-verification';
import { useCart } from '@/lib/hooks/use-cart';
import { useAddresses } from '@/lib/hooks/use-profile';
import { useCreateOrder } from '@/lib/hooks/use-checkout';
import { useAuthStore } from '@/lib/stores/auth-store';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: cart, isLoading: cartLoading } = useCart();

  // Only fetch addresses when authenticated (they require auth)
  const { data: addresses, isLoading: addrLoading } = useAddresses();
  const createOrderMutation = useCreateOrder();

  // Local state
  const [selectedAddress, setSelectedAddress] = useState('');
  const [policyAcknowledged, setPolicyAcknowledged] = useState(false);
  const [notes, setNotes] = useState('');

  // Pre-select the default address once addresses load
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
      setSelectedAddress(defaultAddr.id);
    }
  }, [addresses, selectedAddress]);

  // Redirect back to cart if it's empty
  useEffect(() => {
    if (!cartLoading && cart && (!cart.items || cart.items.length === 0)) {
      toast.error('Your cart is empty');
      router.push('/cart');
    }
  }, [cart, cartLoading, router]);

  // ── Loading state ─────────────────────────────────────────────────
  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
        <p className="text-muted-foreground mt-3">Loading checkout...</p>
      </div>
    );
  }

  const items = cart?.items || [];
  const totalInCents = cart?.totalInCents || 0;

  // ── Guest flow: show OTP verification ─────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back to cart link */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to cart
        </Link>

        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        <p className="text-muted-foreground mb-6 text-center">
          Please verify your email to continue with checkout. If you already have an account,
          you will be logged in automatically.
        </p>

        <OTPVerification
          title="Verify to Checkout"
          description="Enter your email and verify with OTP to place your order."
        />
      </div>
    );
  }

  // ── Authenticated flow: loading addresses ─────────────────────────
  if (addrLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
        <p className="text-muted-foreground mt-3">Loading checkout...</p>
      </div>
    );
  }

  // ── Handle order placement ────────────────────────────────────────
  function handlePlaceOrder() {
    if (!selectedAddress) {
      toast.error('Please select a shipping address');
      return;
    }
    if (!policyAcknowledged) {
      toast.error('Please acknowledge the return policy');
      return;
    }

    createOrderMutation.mutate(
      {
        shippingAddressId: selectedAddress,
        notes: notes || undefined,
        paymentMethod: 'COD', // COD is the only payment method for now
      },
      {
        onSuccess: (data: any) => {
          toast.success(`Order ${data.orderNumber} placed successfully!`);
          router.push(`/orders/${data.orderNumber}/confirmation`);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.error || 'Checkout failed. Please try again.');
        },
      },
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Back to cart link */}
      <Link
        href="/cart"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to cart
      </Link>

      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="space-y-6">
        {/* Step 1: Shipping Address */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Step 1 — Shipping Address
          </h2>
          <AddressSelector
            selectedId={selectedAddress}
            onSelect={setSelectedAddress}
          />
        </div>

        {/* Step 2: Order Summary + Policy */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Step 2 — Review Your Order
          </h2>
          <OrderSummary
            items={items}
            totalInCents={totalInCents}
            policyAcknowledged={policyAcknowledged}
            onPolicyChange={setPolicyAcknowledged}
          />
        </div>

        {/* Order notes (optional) */}
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="notes">Order Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Any special instructions for this order..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Step 3: Payment */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Step 3 — Payment
          </h2>
          <PaymentSection
            totalInCents={totalInCents}
            disabled={!selectedAddress || !policyAcknowledged}
            loading={createOrderMutation.isPending}
            onPay={handlePlaceOrder}
          />
        </div>
      </div>
    </div>
  );
}
