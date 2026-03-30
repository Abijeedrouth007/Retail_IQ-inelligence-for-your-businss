import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { toast } from 'sonner';
import {
  Search,
  ShoppingCart,
  Heart,
  Package,
  Loader2,
  Zap
} from 'lucide-react';
import { formatCurrency, useConfig } from '../../contexts/ConfigContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const StorePage = () => {
  const navigate = useNavigate();
  const { currencySymbol } = useConfig();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [wishlist, setWishlist] = useState(new Set());
  const [buyingNow, setBuyingNow] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      try {
        const [productsRes, categoriesRes, wishlistRes] = await Promise.all([
          fetch(`${API_URL}/api/products`, { headers }),
          fetch(`${API_URL}/api/products/categories/list`, { headers }),
          token ? fetch(`${API_URL}/api/wishlist`, { headers }) : Promise.resolve({ ok: false })
        ]);

        if (productsRes.ok) setProducts(await productsRes.json());
        if (categoriesRes.ok) setCategories(await categoriesRes.json());
        if (wishlistRes.ok) {
          const wishlistData = await wishlistRes.json();
          setWishlist(new Set(wishlistData.map(w => w.product_id)));
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addToCart = async (productId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 })
      });

      if (res.ok) {
        toast.success('Added to cart!');
      } else {
        toast.error('Failed to add to cart');
      }
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const buyNow = async (productId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to purchase');
      return;
    }

    setBuyingNow(productId);
    try {
      const res = await fetch(`${API_URL}/api/checkout/buy-now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1,
          origin_url: window.location.origin
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to initiate checkout');
      }
    } catch (error) {
      toast.error('Failed to initiate checkout');
    } finally {
      setBuyingNow(null);
    }
  };

  const toggleWishlist = async (productId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to save items');
      return;
    }

    try {
      if (wishlist.has(productId)) {
        // Need to get wishlist_id first
        const wishlistRes = await fetch(`${API_URL}/api/wishlist`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (wishlistRes.ok) {
          const items = await wishlistRes.json();
          const item = items.find(w => w.product_id === productId);
          if (item) {
            await fetch(`${API_URL}/api/wishlist/${item.wishlist_id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            setWishlist(prev => {
              const next = new Set(prev);
              next.delete(productId);
              return next;
            });
            toast.success('Removed from wishlist');
          }
        }
      } else {
        const res = await fetch(`${API_URL}/api/wishlist/${productId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setWishlist(prev => new Set(prev).add(productId));
          toast.success('Added to wishlist!');
        }
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-['Outfit']">Store</h1>
          <p className="text-zinc-400 mt-1">Browse our products</p>
        </div>

        {/* Search and Filters */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-zinc-950/50 border-zinc-800"
                  data-testid="search-store-input"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-zinc-950/50 border-zinc-800">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Package className="w-16 h-16 mb-4" />
            <p className="text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.product_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="product-card bg-zinc-900/50 border-zinc-800 overflow-hidden group">
                  <div className="relative aspect-square bg-zinc-800">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-zinc-600" />
                      </div>
                    )}
                    <button
                      onClick={() => toggleWishlist(product.product_id)}
                      className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center transition-colors hover:bg-black/70"
                      data-testid={`wishlist-${product.product_id}`}
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${
                          wishlist.has(product.product_id) ? 'fill-red-500 text-red-500' : 'text-white'
                        }`}
                      />
                    </button>
                    {product.stock_quantity <= 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Badge className="badge-danger">Out of Stock</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                        {product.category}
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-1 line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xl font-bold font-['JetBrains_Mono'] text-violet-400">
                        {formatCurrency(product.price, currencySymbol)}
                      </span>
                      <span className={`text-sm ${
                        product.stock_quantity <= 0 ? 'text-red-400' :
                        product.stock_quantity <= product.reorder_level ? 'text-amber-400' :
                        'text-teal-400'
                      }`}>
                        {product.stock_quantity <= 0 ? 'Out of stock' :
                         product.stock_quantity <= 5 ? `Only ${product.stock_quantity} left` :
                         'In stock'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        variant="outline"
                        disabled={product.stock_quantity <= 0}
                        onClick={() => addToCart(product.product_id)}
                        data-testid={`add-to-cart-${product.product_id}`}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Cart
                      </Button>
                      <Button
                        className="flex-1 btn-primary"
                        disabled={product.stock_quantity <= 0 || buyingNow === product.product_id}
                        onClick={() => buyNow(product.product_id)}
                        data-testid={`buy-now-${product.product_id}`}
                      >
                        {buyingNow === product.product_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Buy Now
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StorePage;
