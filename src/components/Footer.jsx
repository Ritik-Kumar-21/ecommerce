import { Store } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white text-xl font-bold mb-3">
              <Store className="w-6 h-6" />
              ShopVibe
            </div>
            <p className="text-sm">
              Curated products for modern living. Quality you can trust.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-white transition-colors">Products</a></li>
              <li><a href="/cart" className="hover:text-white transition-colors">Cart</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>support@shopvibe.com</li>
              <li>1-800-SHOP-NOW</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} ShopVibe. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
