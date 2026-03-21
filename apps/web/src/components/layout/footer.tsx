import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#f0eded] border-t border-[#e7e5e4]/20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-8 py-16 max-w-7xl mx-auto text-sm leading-relaxed">
        <div>
          <Link href="/" className="text-xl font-black text-primary-600 mb-4 block tracking-tight">Crochet Hub</Link>
          <p className="text-[#78716c] mb-6">
            A premium marketplace dedicated to the tactile soul. We curate the finest handmade crochet from verified artisans.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-[#1c1b1b] mb-6 uppercase tracking-widest text-xs">Shop</h4>
          <ul className="space-y-4">
            <li><Link href="/products" className="text-[#1c1b1b]/70 hover:text-primary-600 transition-colors">All Products</Link></li>
            <li><Link href="/products" className="text-[#1c1b1b]/70 hover:text-primary-600 transition-colors">Categories</Link></li>
            <li><Link href="/on-demand/new" className="text-[#1c1b1b]/70 hover:text-primary-600 transition-colors">Custom Order</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-[#1c1b1b] mb-6 uppercase tracking-widest text-xs">My Account</h4>
          <ul className="space-y-4">
            <li><Link href="/profile" className="text-[#1c1b1b]/70 hover:text-primary-600 transition-colors">My Profile</Link></li>
            <li><Link href="/orders" className="text-[#1c1b1b]/70 hover:text-primary-600 transition-colors">Order History</Link></li>
            <li><Link href="/seller/register" className="text-[#1c1b1b]/70 hover:text-primary-600 transition-colors">Sell on Crochet Hub</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-[#1c1b1b] mb-6 uppercase tracking-widest text-xs">Support</h4>
          <ul className="space-y-4">
            <li><span className="text-[#1c1b1b]/70">Returns & Refunds</span></li>
            <li><span className="text-[#1c1b1b]/70">Quality Guarantee</span></li>
            <li><span className="text-[#1c1b1b]/70">Contact Us</span></li>
            <li><span className="text-[#1c1b1b]/70">Shipping Info</span></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-8 py-8 border-t border-[#e7e5e4]/30 text-center">
        <p className="text-[#78716c]/60 text-xs">&copy; {new Date().getFullYear()} Crochet Hub. Crafted for the tactile soul.</p>
      </div>
    </footer>
  );
}
