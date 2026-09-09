import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';
import { Search, X, Store, ShoppingBag } from 'lucide-react';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const activeCategory = searchParams.get('category') || '';
  const activeSource = searchParams.get('source') || '';

  useEffect(() => {
    api.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeCategory) params.category = activeCategory;
    if (searchParams.get('search')) params.search = searchParams.get('search');
    if (searchParams.get('source')) params.source = searchParams.get('source');

    api.getProducts(params).then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handleCategory = (cat) => {
    const params = new URLSearchParams(searchParams);
    if (cat === activeCategory) {
      params.delete('category');
    } else {
      params.set('category', cat);
    }
    setSearchParams(params);
  };

  const handleSource = (src) => {
    const params = new URLSearchParams(searchParams);
    if (src === activeSource) {
      params.delete('source');
    } else {
      params.set('source', src);
    }
    setSearchParams(params);
  };

  const sourceFilters = [
    { key: '', label: 'All Stores', icon: <Store className="w-4 h-4" /> },
    { key: 'amazon', label: 'Amazon', icon: <span className="text-orange-500 font-bold text-sm">a</span>, color: 'border-orange-300 bg-orange-50 text-orange-700' },
    { key: 'flipkart', label: 'Flipkart', icon: <span className="text-blue-500 font-bold text-sm">f</span>, color: 'border-blue-300 bg-blue-50 text-blue-700' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
          Shop the Best from
          <span className="text-indigo-600"> Amazon</span> & <span className="text-blue-600">Flipkart</span>
        </h1>
        <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
          Curated top-selling products from India's biggest stores. Compare, shop, and save.
        </p>
      </div>

      {/* Source Filters */}
      <div className="flex justify-center gap-3 mb-6">
        {sourceFilters.map((src) => (
          <button
            key={src.key}
            onClick={() => handleSource(src.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border-2 transition-all ${
              activeSource === src.key
                ? src.key === 'amazon'
                  ? 'border-orange-400 bg-orange-500 text-white'
                  : src.key === 'flipkart'
                  ? 'border-blue-400 bg-blue-500 text-white'
                  : 'border-indigo-400 bg-indigo-600 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            {src.icon}
            {src.label}
          </button>
        ))}
      </div>

      {/* Search & Category Filters */}
      <div className="mb-8 space-y-4">
        <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                const params = new URLSearchParams(searchParams);
                params.delete('search');
                setSearchParams(params);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </form>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => handleCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !activeCategory
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products count */}
      {!loading && (
        <p className="text-sm text-gray-500 mb-4 text-center">
          Showing {products.length} product{products.length !== 1 ? 's' : ''}
          {activeCategory && <> in <span className="font-medium text-gray-700">{activeCategory}</span></>}
          {activeSource && <> from <span className="font-medium text-gray-700 capitalize">{activeSource}</span></>}
        </p>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-gray-200 rounded w-16" />
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-6 bg-gray-200 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">No products found.</p>
          <button
            onClick={() => setSearchParams({})}
            className="mt-3 text-indigo-600 font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
