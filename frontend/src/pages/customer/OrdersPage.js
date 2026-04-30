import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';
import { toast } from 'sonner';
import {
  Package,
  History,
  RefreshCw,
  Loader2,
  ShoppingBag,
  Truck,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { formatCurrency, useConfig } from '../../contexts/ConfigContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Confirmed' },
  shipped: { icon: Truck, color: 'text-violet-400', bg: 'bg-violet-500/20', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'text-teal-400', bg: 'bg-teal-500/20', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Cancelled' }
};

const OrdersPage = () => {
  const { currencySymbol } = useConfig();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${API_URL}/api/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const reorder = async (order) => {
    const token = localStorage.getItem('token');
    
    try {
      // Add items to cart
      for (const item of order.items) {
        await fetch(`${API_URL}/api/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ product_id: item.product_id, quantity: item.quantity })
        });
      }
      toast.success('Items added to cart!');
    } catch (error) {
      toast.error('Failed to add items to cart');
    }
  };

  const getStatusConfig = (status) => statusConfig[status] || statusConfig.pending;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-['Outfit']">Order History</h1>
          <p className="text-zinc-400 mt-1">View and track your orders</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <History className="w-16 h-16 text-zinc-600 mb-4" />
              <p className="text-lg text-zinc-400">No orders yet</p>
              <Button className="mt-4" variant="outline" onClick={() => window.location.href = '/store'}>
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => {
              const statusCfg = getStatusConfig(order.status);
              const StatusIcon = statusCfg.icon;
              
              return (
                <motion.div
                  key={order.order_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <Accordion type="single" collapsible>
                      <AccordionItem value={order.order_id} className="border-none">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full mr-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl ${statusCfg.bg} flex items-center justify-center`}>
                                <StatusIcon className={`w-6 h-6 ${statusCfg.color}`} />
                              </div>
                              <div className="text-left">
                                <p className="font-medium">
                                  Order #{order.order_id.slice(4, 16)}
                                </p>
                                <p className="text-sm text-zinc-500">
                                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge className={`${statusCfg.bg} ${statusCfg.color} border-none`}>
                                {statusCfg.label}
                              </Badge>
                              {order.payment_status && (
                                <Badge className={order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}>
                                  {order.payment_status === 'paid' ? 'Paid' : order.payment_status === 'cod' ? 'COD' : 'Pending'}
                                </Badge>
                              )}
                              <span className="font-['JetBrains_Mono'] text-lg text-violet-400">
                                {formatCurrency(order.total_amount, currencySymbol)}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-4">
                          <div className="border-t border-zinc-800 pt-4">
                            {/* Order Timeline */}
                            <div className="mb-6">
                              <h4 className="text-sm font-medium text-zinc-400 mb-3">Order Status</h4>
                              <div className="flex items-center gap-2">
                                {['pending', 'confirmed', 'shipped', 'delivered'].map((step, i) => {
                                  const stepCfg = statusConfig[step];
                                  const isActive = ['pending', 'confirmed', 'shipped', 'delivered'].indexOf(order.status) >= i;
                                  const isCurrent = order.status === step;
                                  
                                  return (
                                    <React.Fragment key={step}>
                                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
                                        isActive ? stepCfg.bg + ' ' + stepCfg.color : 'bg-zinc-800 text-zinc-500'
                                      } ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-zinc-900 ring-violet-500' : ''}`}>
                                        <stepCfg.icon className="w-3 h-3" />
                                        {stepCfg.label}
                                      </div>
                                      {i < 3 && (
                                        <div className={`flex-1 h-0.5 ${isActive ? 'bg-violet-500' : 'bg-zinc-700'}`} />
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </div>
                            
                            <h4 className="text-sm font-medium text-zinc-400 mb-3">Order Items</h4>
                            <div className="space-y-3">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <Package className="w-5 h-5 text-zinc-500" />
                                    <div>
                                      <p className="font-medium">{item.product_name}</p>
                                      <p className="text-sm text-zinc-500">
                                        {formatCurrency(item.unit_price, currencySymbol)} × {item.quantity}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="font-['JetBrains_Mono']">
                                    {formatCurrency(item.total, currencySymbol)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end mt-4">
                              <Button
                                variant="outline"
                                className="border-zinc-700"
                                onClick={() => reorder(order)}
                                data-testid={`reorder-${order.order_id}`}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reorder
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrdersPage;
