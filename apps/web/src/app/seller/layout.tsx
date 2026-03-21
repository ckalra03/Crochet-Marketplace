'use client';

import { StorefrontNav } from '@/components/layout/storefront-nav';
import { DashboardSidebar, sellerSidebarItems } from '@/components/layout/dashboard-sidebar';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontNav />
      <div className="flex flex-1">
        <DashboardSidebar items={sellerSidebarItems} title="Seller Panel" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
