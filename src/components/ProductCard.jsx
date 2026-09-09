import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    try {
      await addToCart(product.id);
    } finally {
      setAdding(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const sourceBadge = {
    amazon: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Amazon' },
    flipkart: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Flipkart' },
    shopvibe: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'ShopVibe' },
  };

  const badge = sourceBadge[product.source] || sourceBadge.shopvibe;

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Source Badge */}
        <span className={`absolute top-3 left-3 ${badge.bg} ${badge.text} text-xs font-bold px-2.5 py-1 rounded-full`}>
          {badge.label}
        </span>
      </div>
      <div className="p-4">
        <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">
          {product.category}
        </span>
        <h3 className="mt-1 text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">{formatPrice(product.price)}</span>
          <button
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
        {product.stock === 0 && (
          <p className="mt-2 text-sm text-red-500 font-medium">Out of stock</p>
        )}
      </div>
    </Link>
  );
}
