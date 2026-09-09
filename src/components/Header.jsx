import { Link } from 'react-router-dom';
import { ShoppingBag, Store, LogIn, LogOut, Shield } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors">
            <Store className="w-6 h-6" />
            ShopVibe
          </Link>

          <nav className="hidden sm:flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Products</Link>
            <Link to="/?category=Bags" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Bags</Link>
            <Link to="/?category=Electronics" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Electronics</Link>
            <Link to="/?category=Accessories" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Accessories</Link>
          </nav>

          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:block">Hi, {user.name}</span>
                <button
                  onClick={logout}
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            )}

            <Link
              to="/cart"
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ShoppingBag className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
