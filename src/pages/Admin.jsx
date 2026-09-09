import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  BarChart3,
} from 'lucide-react';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: '',
    stock: '',
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAll();
    }
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, p, o] = await Promise.all([
        api.getAdminStats(),
        api.getAdminProducts(),
        api.getAdminOrders(),
      ]);
      setStats(s);
      setProducts(p);
      setOrders(o);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...productForm,
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock) || 10,
    };
    if (editingProduct) {
      await api.updateProduct(editingProduct.id, data);
    } else {
      await api.createProduct(data);
    }
    setShowProductModal(false);
    setEditingProduct(null);
    setProductForm({ name: '', description: '', price: '', image: '', category: '', stock: '' });
    loadAll();
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image,
      category: product.category,
      stock: product.stock.toString(),
    });
    setShowProductModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await api.deleteProduct(id);
    loadAll();
  };

  const handleStatusChange = async (orderId, status) => {
    await api.updateOrderStatus(orderId, status);
    loadAll();
  };

  if (authLoading || !user || user.role !== 'admin') return null;

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex gap-2">
          {['dashboard', 'products', 'orders'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors capitalize ${
                tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Dashboard Tab */}
          {tab === 'dashboard' && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<DollarSign />} label="Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} color="green" />
              <StatCard icon={<ShoppingCart />} label="Orders" value={stats.totalOrders} color="blue" />
              <StatCard icon={<Package />} label="Products" value={stats.totalProducts} color="purple" />
              <StatCard icon={<Users />} label="Users" value={stats.totalUsers} color="orange" />
              {stats.pendingOrders > 0 && (
                <div className="sm:col-span-2 lg:col-span-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="text-yellow-800 font-medium">
                      {stats.pendingOrders} pending order{stats.pendingOrders > 1 ? 's' : ''} need attention
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Products Tab */}
          {tab === 'products' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({ name: '', description: '', price: '', image: '', category: '', stock: '' });
                    setShowProductModal(true);
                  }}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Product</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Category</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Price</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Stock</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            <span className="font-medium text-gray-900">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.category}</td>
                        <td className="px-4 py-3 text-sm font-medium">${p.price.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-sm font-medium ${
                              p.stock === 0 ? 'text-red-500' : p.stock < 10 ? 'text-yellow-600' : 'text-green-600'
                            }`}
                          >
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleEdit(p)} className="p-1 text-gray-400 hover:text-indigo-600">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="p-1 text-gray-400 hover:text-red-500 ml-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {tab === 'orders' && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Order</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Customer</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Total</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No orders yet
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">#{o.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{o.customer_name}</td>
                        <td className="px-4 py-3 text-sm font-medium">${o.total.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <select
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${statusColors[o.status]} cursor-pointer`}
                          >
                            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(o.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <input
                placeholder="Product name"
                value={productForm.name}
                onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <textarea
                placeholder="Description"
                value={productForm.description}
                onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={productForm.price}
                  onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
                  required
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={productForm.stock}
                  onChange={(e) => setProductForm((p) => ({ ...p, stock: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <input
                placeholder="Image URL"
                value={productForm.image}
                onChange={(e) => setProductForm((p) => ({ ...p, image: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <input
                placeholder="Category"
                value={productForm.category}
                onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                {editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
