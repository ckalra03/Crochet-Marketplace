'use client';
import { create } from 'zustand';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    name: string;
    priceInCents: number;
    slug: string;
    media?: { filePath: string }[];
    sellerProfile?: { businessName: string };
  };
}

/** Applied coupon state shared between cart and checkout */
interface AppliedCoupon {
  couponId: string;
  code: string;
  type: string;
  discountCents: number;
}

interface CartState {
  items: CartItem[];
  totalInCents: number;
  itemCount: number;
  /** Whether the side cart drawer is open */
  isDrawerOpen: boolean;
  /** Coupon applied in cart — persists to checkout */
  appliedCoupon: AppliedCoupon | null;
  setCart: (items: CartItem[], totalInCents: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  setCoupon: (coupon: AppliedCoupon | null) => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  totalInCents: 0,
  itemCount: 0,
  isDrawerOpen: false,
  appliedCoupon: null,
  setCart: (items, totalInCents) =>
    set({ items, totalInCents, itemCount: items.length }),
  clearCart: () => set({ items: [], totalInCents: 0, itemCount: 0, appliedCoupon: null }),
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  setCoupon: (coupon) => set({ appliedCoupon: coupon }),
}));
