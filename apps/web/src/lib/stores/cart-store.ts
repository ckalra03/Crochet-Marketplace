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

interface CartState {
  items: CartItem[];
  totalInCents: number;
  itemCount: number;
  /** Whether the side cart drawer is open */
  isDrawerOpen: boolean;
  setCart: (items: CartItem[], totalInCents: number) => void;
  clearCart: () => void;
  /** Open the side cart drawer */
  openDrawer: () => void;
  /** Close the side cart drawer */
  closeDrawer: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  totalInCents: 0,
  itemCount: 0,
  isDrawerOpen: false,
  setCart: (items, totalInCents) =>
    set({ items, totalInCents, itemCount: items.length }),
  clearCart: () => set({ items: [], totalInCents: 0, itemCount: 0 }),
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
}));
