'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useCartStore } from '@/lib/stores/cart-store';
import { useCategories } from '@/lib/hooks/use-catalog';
import { ShoppingCart, User, LogOut, Package, LayoutDashboard, ChevronDown } from 'lucide-react';
import { NotificationBell } from './notification-bell';

/**
 * Storefront navigation bar.
 * Shows cart icon for ALL users (guest + authenticated).
 * Shows auth-specific links (orders, profile, dashboard) only when logged in.
 */
export function StorefrontNav() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount);
  const { data: categories } = useCategories();

  // Hover dropdown state for categories (desktop only)
  const [catOpen, setCatOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Open dropdown on mouse enter, cancel any pending close
  function handleCatEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setCatOpen(true);
  }

  // Delay closing so user can move mouse from trigger to dropdown
  function handleCatLeave() {
    closeTimer.current = setTimeout(() => setCatOpen(false), 150);
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-[#fcf9f8]/80 backdrop-blur-xl border-b border-[#e7e5e4]/40 shadow-[0_4px_30px_rgba(162,56,44,0.04)]">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Left: Logo + navigation links */}
        <div className="flex items-center gap-10">
          <Link href="/" className="text-2xl font-black text-primary-600 tracking-tight">
            Crochet Hub
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/products" className="text-[#1c1b1b] font-medium hover:text-primary-600 transition-colors duration-300 text-sm">
              Shop
            </Link>

            {/* Categories hover dropdown (desktop) */}
            <div
              className="relative"
              onMouseEnter={handleCatEnter}
              onMouseLeave={handleCatLeave}
            >
              <button className="flex items-center gap-1 text-[#1c1b1b] font-medium hover:text-primary-600 transition-colors duration-300 text-sm">
                Categories
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown panel */}
              {catOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#e7e5e4]/60 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  {categories && categories.length > 0 ? (
                    categories.map((cat: any) => (
                      <Link
                        key={cat.id}
                        href={`/products?categoryId=${cat.id}`}
                        className="block px-4 py-2.5 text-sm text-[#1c1b1b] hover:bg-primary-50 hover:text-primary-600 transition-colors"
                        onClick={() => setCatOpen(false)}
                      >
                        {cat.name}
                      </Link>
                    ))
                  ) : (
                    <span className="block px-4 py-2.5 text-sm text-muted-foreground">
                      No categories yet
                    </span>
                  )}
                </div>
              )}
            </div>

            <Link href="/on-demand/new" className="text-[#1c1b1b] font-medium hover:text-primary-600 transition-colors duration-300 text-sm">
              Custom Order
            </Link>

            {/* Mobile: Categories just links to /products (no hover on touch) */}
          </div>

          {/* Mobile nav: simple Categories link (visible on small screens via md:hidden) */}
        </div>

        {/* Right: Cart + auth controls */}
        <div className="flex items-center gap-4">
          {/* Cart icon — opens side cart drawer instead of navigating */}
          <button
            onClick={() => useCartStore.getState().openDrawer()}
            className="relative p-2 text-[#1c1b1b] hover:text-primary-600 transition-colors"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {itemCount}
              </span>
            )}
          </button>

          {isAuthenticated ? (
            <>
              {/* Orders link */}
              <Link href="/orders" className="p-2 text-[#1c1b1b] hover:text-primary-600 transition-colors">
                <Package className="h-5 w-5" />
              </Link>

              {/* Notification bell — positioned after orders to avoid overlapping cart */}
              <NotificationBell />

              {/* Role-specific dashboard links */}
              {user?.role === 'SELLER' && (
                <Link href="/seller" className="text-sm font-medium text-[#1c1b1b] hover:text-primary-600 transition-colors hidden md:block">
                  Seller Dashboard
                </Link>
              )}
              {user?.role === 'ADMIN' && (
                <Link href="/admin" className="flex items-center gap-1 text-sm font-medium text-[#1c1b1b] hover:text-primary-600 transition-colors hidden md:block">
                  <LayoutDashboard className="h-4 w-4" /> Admin
                </Link>
              )}

              {/* User avatar + logout */}
              <div className="border-l border-[#e7e5e4] pl-4 ml-2 flex items-center gap-3">
                <Link href="/profile" className="w-9 h-9 rounded-full bg-primary-600/10 flex items-center justify-center text-primary-600 font-bold text-sm hover:bg-primary-600/20 transition-colors">
                  {user?.name?.charAt(0) || 'U'}
                </Link>
                <button onClick={() => { logout(); window.location.href = '/'; }}
                  className="p-2 text-[#78716c] hover:text-red-500 transition-colors">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            /* Guest: Login + Sign Up buttons */
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-[#1c1b1b] font-medium hover:text-primary-600 transition-colors text-sm">
                Login
              </Link>
              <Link href="/register">
                <button className="bg-primary-600 text-white px-5 py-2 rounded-full font-semibold text-sm hover:bg-primary-700 transition-all active:scale-95 shadow-lg shadow-primary-600/20">
                  Sign Up
                </button>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
