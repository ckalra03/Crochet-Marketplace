'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useCartStore } from '@/lib/stores/cart-store';
import { ShoppingCart, User, LogOut, Package, LayoutDashboard, Search } from 'lucide-react';
import { NotificationBell } from './notification-bell';

export function StorefrontNav() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#fcf9f8]/80 backdrop-blur-xl border-b border-[#e7e5e4]/40 shadow-[0_4px_30px_rgba(162,56,44,0.04)]">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-10">
          <Link href="/" className="text-2xl font-black text-primary-600 tracking-tight">
            Crochet Hub
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/products" className="text-[#1c1b1b] font-medium hover:text-primary-600 transition-colors duration-300 text-sm">
              Shop
            </Link>
            <Link href="/products" className="text-[#1c1b1b] font-medium hover:text-primary-600 transition-colors duration-300 text-sm">
              Categories
            </Link>
            <Link href="/on-demand/new" className="text-[#1c1b1b] font-medium hover:text-primary-600 transition-colors duration-300 text-sm">
              Custom Order
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <Link href="/cart" className="relative p-2 text-[#1c1b1b] hover:text-primary-600 transition-colors">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {itemCount}
                  </span>
                )}
              </Link>
              <Link href="/orders" className="p-2 text-[#1c1b1b] hover:text-primary-600 transition-colors">
                <Package className="h-5 w-5" />
              </Link>
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
