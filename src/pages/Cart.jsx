import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

export default function Cart() {
  const { items, loading, updateQuantity, removeItem, totalItems, totalPrice } = useCart();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="mt-2 text-gray-500">Looks like you haven't added anything yet.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Continue Shopping
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
          >
            <Link to={`/product/${item.product_id}`} className="shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
              />
            </Link>

            <div className="flex-1 min-w-0">
              <Link
                to={`/product/${item.product_id}`}
                className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors truncate block"
              >
                {item.name}
              </Link>
              <p className="text-indigo-600 font-bold mt-1">{formatPrice(item.price)}</p>
            </div>

            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="p-2 hover:bg-gray-100 transition-colors rounded-l-lg"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 py-2 font-medium min-w-[2.5rem] text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                disabled={item.quantity >= item.stock}
                className="p-2 hover:bg-gray-100 transition-colors rounded-r-lg disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <p className="hidden sm:block text-lg font-bold text-gray-900 w-28 text-right">
              {formatPrice(item.price * item.quantity)}
            </p>

            <button
              onClick={() => removeItem(item.id)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between text-lg">
          <span className="text-gray-600">
            Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </span>
          <span className="text-2xl font-bold text-gray-900">{formatPrice(totalPrice)}</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">Shipping and taxes calculated at checkout.</p>

        <Link
          to="/checkout"
          className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-xl text-lg font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all"
        >
          Proceed to Checkout
          <ArrowRight className="w-5 h-5" />
        </Link>

        <Link
          to="/"
          className="mt-3 w-full flex items-center justify-center text-indigo-600 py-2 hover:underline transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
