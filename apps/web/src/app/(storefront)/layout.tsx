import { StorefrontNav } from '@/components/layout/storefront-nav';
import { Footer } from '@/components/layout/footer';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
