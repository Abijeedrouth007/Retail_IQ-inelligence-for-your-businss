import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Package,
  Loader2
} from 'lucide-react';
import { formatCurrency, useConfig } from '../../contexts/ConfigContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const WishlistPage = () => {
  const { currencySymbol } = useConfig();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeFromWishlist = async (wishlistId) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/wishlist/${wishlistId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setWishlist(prev => prev.filter(item => item.wishlist_id !== wishlistId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const moveToCart = async (item) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: item.product_id, quantity: 1 })
      });
      await removeFromWishlist(item.wishlist_id);
      toast.success('Moved to cart!');
    } catch (error) {
      toast.error('Failed to move to cart');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-['Outfit']">Wishlist</h1>
          <p className="text-zinc-400 mt-1">{wishlist.length} saved items</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
          </div>
        ) : wishlist.length === 0 ? (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Heart className="w-16 h-16 text-zinc-600 mb-4" />
              <p className="text-lg text-zinc-400">Your wishlist is empty</p>
              <Button className="mt-4" variant="outline" onClick={() => window.location.href = '/store'}>
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item, index) => (
              <motion.div
                key={item.wishlist_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden group">
                  <div className="relative aspect-square bg-zinc-800">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-zinc-600" />
                      </div>
                    )}
                    <button
                      onClick={() => removeFromWishlist(item.wishlist_id)}
                      className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center transition-colors hover:bg-red-500/20"
                      data-testid={`remove-wishlist-${item.wishlist_id}`}
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                    {item.stock_quantity <= 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Badge className="badge-danger">Out of Stock</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                        {item.category}
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-2 line-clamp-1">{item.product_name}</h3>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold font-['JetBrains_Mono'] text-violet-400">
                        {formatCurrency(item.price, currencySymbol)}
                      </span>
                      <span className={`text-sm ${
                        item.stock_quantity <= 0 ? 'text-red-400' : 'text-teal-400'
                      }`}>
                        {item.stock_quantity <= 0 ? 'Out of stock' : 'In stock'}
                      </span>
                    </div>
                    <Button
                      className="w-full btn-primary"
                      disabled={item.stock_quantity <= 0}
                      onClick={() => moveToCart(item)}
                      data-testid={`move-to-cart-${item.wishlist_id}`}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Move to Cart
                    </Button>
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

export default WishlistPage;
