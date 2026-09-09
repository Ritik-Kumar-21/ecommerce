import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { CheckCircle, ArrowRight } from 'lucide-react';

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOrder(id).then((data) => {
      setOrder(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
        <Link to="/" className="mt-4 inline-block text-indigo-600 hover:underline">Go home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      <h1 className="mt-4 text-3xl font-bold text-gray-900">Order Confirmed! 🎉</h1>
      <p className="mt-2 text-gray-500">
        Thank you for your purchase. Your order #{order.id} has been placed.
      </p>

      <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-left">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Order Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Name</p>
            <p className="font-medium">{order.customer_name}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium">{order.customer_email}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Address</p>
            <p className="font-medium">{order.customer_address}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <img
                src={item.image}
                alt={item.name}
                className="w-12 h-12 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <span className="font-medium text-gray-600">Total</span>
          <span className="text-xl font-bold text-gray-900">{formatPrice(order.total)}</span>
        </div>
      </div>

      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
      >
        Continue Shopping
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
