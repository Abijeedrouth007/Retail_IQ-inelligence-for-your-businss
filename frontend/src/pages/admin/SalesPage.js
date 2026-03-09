import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Download,
  Loader2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            Revenue: ${entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const SalesPage = () => {
  const [stats, setStats] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const [statsRes, trendRes, ordersRes] = await Promise.all([
          fetch(`${API_URL}/api/analytics/dashboard`, { headers }),
          fetch(`${API_URL}/api/analytics/sales-trend?days=7`, { headers }),
          fetch(`${API_URL}/api/orders`, { headers })
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (trendRes.ok) setSalesTrend(await trendRes.json());
        if (ordersRes.ok) setOrders(await ordersRes.json());
      } catch (error) {
        console.error('Failed to fetch sales data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const todayRevenue = salesTrend.length > 0 ? salesTrend[salesTrend.length - 1]?.revenue : 0;

  const exportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date'];
    const rows = orders.map(o => [
      o.order_id,
      o.customer_name || 'N/A',
      o.items.length,
      o.total_amount.toFixed(2),
      o.status,
      new Date(o.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-['Outfit']">Sales</h1>
            <p className="text-zinc-400 mt-1">Track your revenue and orders</p>
          </div>
          <Button onClick={exportCSV} variant="outline" className="border-zinc-700" data-testid="export-csv-btn">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold font-['JetBrains_Mono']">
                      ${stats?.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Today's Revenue</p>
                    <p className="text-2xl font-bold font-['JetBrains_Mono']">
                      ${todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Total Orders</p>
                    <p className="text-2xl font-bold font-['JetBrains_Mono']">{orders.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle>7-Day Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrend}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#52525b"
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                    />
                    <YAxis 
                      stroke="#52525b"
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2dd4bf"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Orders */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                  <ShoppingCart className="w-12 h-12 mb-4" />
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="data-table">
                    <TableHeader>
                      <TableRow className="border-zinc-800 hover:bg-transparent">
                        <TableHead className="text-zinc-400">Order ID</TableHead>
                        <TableHead className="text-zinc-400">Customer</TableHead>
                        <TableHead className="text-zinc-400">Items</TableHead>
                        <TableHead className="text-zinc-400">Total</TableHead>
                        <TableHead className="text-zinc-400">Status</TableHead>
                        <TableHead className="text-zinc-400">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.slice(0, 10).map((order) => (
                        <TableRow key={order.order_id} className="border-zinc-800">
                          <TableCell className="font-['JetBrains_Mono'] text-sm">
                            {order.order_id.slice(0, 12)}...
                          </TableCell>
                          <TableCell>{order.customer_name || 'N/A'}</TableCell>
                          <TableCell>{order.items.length} items</TableCell>
                          <TableCell className="font-['JetBrains_Mono'] text-teal-400">
                            ${order.total_amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge className="badge-success capitalize">{order.status}</Badge>
                          </TableCell>
                          <TableCell className="text-zinc-400">
                            {new Date(order.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default SalesPage;
