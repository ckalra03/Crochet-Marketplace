'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useCartStore } from '@/lib/stores/cart-store';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, LogOut, Package, LayoutDashboard } from 'lucide-react';

export function StorefrontNav() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-primary-600">
            Crochet Hub
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">
              Shop
            </Link>
            <Link href="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
              Categories
            </Link>
            <Link href="/on-demand/new" className="text-muted-foreground hover:text-foreground transition-colors">
              Custom Order
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary-600 text-[10px] font-bold text-white flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/orders">
                <Button variant="ghost" size="icon">
                  <Package className="h-5 w-5" />
                </Button>
              </Link>
              {user?.role === 'SELLER' && (
                <Link href="/seller">
                  <Button variant="ghost" size="sm">Seller Dashboard</Button>
                </Link>
              )}
              {user?.role === 'ADMIN' && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="h-4 w-4 mr-1" /> Admin
                  </Button>
                </Link>
              )}
              <Link href="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => { logout(); window.location.href = '/'; }}>
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
