'use client';

import { StorefrontNav } from '@/components/layout/storefront-nav';
import { DashboardSidebar, adminSidebarItems } from '@/components/layout/dashboard-sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontNav />
      <div className="flex flex-1">
        <DashboardSidebar items={adminSidebarItems} title="Admin Panel" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
