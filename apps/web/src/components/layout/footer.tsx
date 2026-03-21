import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg text-primary-600 mb-3">Crochet Hub</h3>
            <p className="text-sm text-muted-foreground">
              Discover unique handmade crochet products from curated artisans. Quality-assured, beautifully crafted.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground">All Products</Link></li>
              <li><Link href="/categories" className="hover:text-foreground">Categories</Link></li>
              <li><Link href="/on-demand/new" className="hover:text-foreground">Custom Orders</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/orders" className="hover:text-foreground">My Orders</Link></li>
              <li><Link href="/profile" className="hover:text-foreground">Profile</Link></li>
              <li><Link href="/seller/register" className="hover:text-foreground">Sell on Crochet Hub</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span>Returns & Refunds</span></li>
              <li><span>Quality Guarantee</span></li>
              <li><span>Contact Us</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Crochet Hub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
