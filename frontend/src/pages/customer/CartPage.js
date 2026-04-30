import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  Loader2,
  ArrowRight,
  CreditCard
} from 'lucide-react';
import { formatCurrency, useConfig } from '../../contexts/ConfigContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const CartPage = () => {
  const navigate = useNavigate();
  const { currencySymbol } = useConfig();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [payingOnline, setPayingOnline] = useState(false);

  const fetchCart = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCartItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (cartItemId, newQuantity) => {
    const token = localStorage.getItem('token');
    try {
      if (newQuantity <= 0) {
        await fetch(`${API_URL}/api/cart/${cartItemId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setCartItems(prev => prev.filter(item => item.cart_item_id !== cartItemId));
        toast.success('Item removed');
      } else {
        await fetch(`${API_URL}/api/cart/${cartItemId}?quantity=${newQuantity}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setCartItems(prev => prev.map(item =>
          item.cart_item_id === cartItemId ? { ...item, quantity: newQuantity } : item
        ));
      }
    } catch (error) {
      toast.error('Failed to update cart');
    }
  };

  const removeItem = async (cartItemId) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/cart/${cartItemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCartItems(prev => prev.filter(item => item.cart_item_id !== cartItemId));
      toast.success('Item removed');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const placeOrderCOD = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setPlacing(true);
    const token = localStorage.getItem('token');
    
    try {
      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }));

      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: orderItems })
      });

      if (res.ok) {
        setCartItems([]);
        toast.success('Order placed successfully! (Cash on Delivery)');
        navigate('/orders');
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to place order');
      }
    } catch (error) {
      toast.error('Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const payOnline = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setPayingOnline(true);
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${API_URL}/api/checkout/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          origin_url: window.location.origin
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to initiate payment');
      }
    } catch (error) {
      toast.error('Failed to initiate payment');
    } finally {
      setPayingOnline(false);
    }
  };

  const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-['Outfit']">Shopping Cart</h1>
          <p className="text-zinc-400 mt-1">{cartItems.length} items in your cart</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
          </div>
        ) : cartItems.length === 0 ? (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <ShoppingCart className="w-16 h-16 text-zinc-600 mb-4" />
              <p className="text-lg text-zinc-400">Your cart is empty</p>
              <Button className="mt-4" variant="outline" onClick={() => navigate('/store')}>
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => (
                <motion.div
                  key={item.cart_item_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1">{item.product_name}</h3>
                          <p className="text-lg font-['JetBrains_Mono'] text-violet-400">
                            {formatCurrency(item.price, currencySymbol)}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center gap-2 bg-zinc-800 rounded-lg">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                                data-testid={`decrease-${item.cart_item_id}`}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-8 text-center font-['JetBrains_Mono']">{item.quantity}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                                data-testid={`increase-${item.cart_item_id}`}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-400 hover:bg-red-500/20"
                              onClick={() => removeItem(item.cart_item_id)}
                              data-testid={`remove-${item.cart_item_id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-['JetBrains_Mono'] text-lg">
                            {formatCurrency(item.price * item.quantity, currencySymbol)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="bg-zinc-900/50 border-zinc-800 sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cartItems.map(item => (
                      <div key={item.cart_item_id} className="flex justify-between text-sm">
                        <span className="text-zinc-400 truncate max-w-[150px]">
                          {item.product_name} x{item.quantity}
                        </span>
                        <span className="font-['JetBrains_Mono']">
                          {formatCurrency(item.price * item.quantity, currencySymbol)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-zinc-800 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-2xl font-bold font-['JetBrains_Mono'] text-violet-400">
                        {formatCurrency(total, currencySymbol)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <Button
                      className="w-full btn-primary"
                      onClick={payOnline}
                      disabled={payingOnline || placing}
                      data-testid="pay-online-btn"
                    >
                      {payingOnline ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CreditCard className="w-4 h-4 mr-2" />
                      )}
                      Pay Online
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={placeOrderCOD}
                      disabled={placing || payingOnline}
                      data-testid="place-order-btn"
                    >
                      {placing ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-2" />
                      )}
                      Cash on Delivery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CartPage;
