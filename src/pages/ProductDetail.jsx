import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ShoppingCart, Check, Minus, Plus, Star, Trash2, ExternalLink } from 'lucide-react';

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ count: 0, average: 0 });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getProduct(id),
      api.getReviews(id),
      api.getReviewStats(id),
    ]).then(([p, r, s]) => {
      setProduct(p);
      setReviews(r);
      setReviewStats(s);
      setLoading(false);
    });
  }, [id]);

  const handleAddToCart = async () => {
    await addToCart(product.id, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setSubmittingReview(true);
    try {
      const updated = await api.addReview(id, reviewForm);
      setReviews(updated);
      const stats = await api.getReviewStats(id);
      setReviewStats(stats);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    await api.deleteReview(reviewId);
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    const stats = await api.getReviewStats(id);
    setReviewStats(stats);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-32" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <Link to="/" className="mt-4 inline-block text-indigo-600 hover:underline">Back to shop</Link>
      </div>
    );
  }

  const sourceBadge = {
    amazon: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Available on Amazon' },
    flipkart: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Available on Flipkart' },
    shopvibe: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'ShopVibe Exclusive' },
  };
  const badge = sourceBadge[product.source] || sourceBadge.shopvibe;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 relative">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          <span className={`absolute top-4 left-4 ${badge.bg} ${badge.text} text-sm font-bold px-3 py-1.5 rounded-full`}>
            {badge.label}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-medium text-indigo-600 uppercase tracking-wider">{product.category}</span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">{product.name}</h1>

          {/* Rating summary */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${s <= Math.round(reviewStats.average) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {reviewStats.average > 0 ? reviewStats.average.toFixed(1) : 'No'} ratings ({reviewStats.count} review{reviewStats.count !== 1 ? 's' : ''})
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold text-gray-900">{formatPrice(product.price)}</p>
          <p className="mt-1 text-sm text-gray-400">Inclusive of all taxes</p>
          <p className="mt-4 text-gray-600 leading-relaxed">{product.description}</p>

          <div className="mt-6">
            {product.stock > 0 ? (
              <p className="text-sm text-green-600 font-medium">
                ✓ In stock — {product.stock} units available
              </p>
            ) : (
              <p className="text-sm text-red-500 font-medium">Out of stock</p>
            )}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Qty:</span>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-gray-100 transition-colors rounded-l-lg">
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-2 hover:bg-gray-100 transition-colors rounded-r-lg">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || added}
            className={`mt-6 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-lg font-semibold transition-all ${
              added ? 'bg-green-500 text-white' : product.stock === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {added ? (<><Check className="w-5 h-5" /> Added to Cart!</>) : (<><ShoppingCart className="w-5 h-5" /> Add to Cart — {formatPrice(product.price * quantity)}</>)}
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16 border-t border-gray-200 pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

        {/* Review Form */}
        {user ? (
          <form onSubmit={handleReviewSubmit} className="bg-white p-6 rounded-xl border border-gray-100 mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Write a review</h3>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewForm((p) => ({ ...p, rating: s }))}
                    className="p-0.5"
                  >
                    <Star
                      className={`w-6 h-6 ${s <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              placeholder="Share your experience with this product..."
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
            {reviewError && <p className="text-sm text-red-500 mt-1">{reviewError}</p>}
            <button
              type="submit"
              disabled={submittingReview}
              className="mt-3 bg-indigo-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <div className="bg-gray-50 p-4 rounded-xl mb-8 text-center">
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link> to leave a review.
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white p-5 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {review.user_name[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{review.user_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    {user && (user.id === review.user_id || user.role === 'admin') && (
                      <button onClick={() => handleDeleteReview(review.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {review.comment && <p className="mt-2 text-gray-600">{review.comment}</p>}
                <p className="mt-1 text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
