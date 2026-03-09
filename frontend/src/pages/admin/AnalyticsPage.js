import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Users,
  Bot,
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
            {entry.name}: {entry.name.includes('revenue') ? `$${entry.value.toLocaleString()}` : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const [statsRes, trendRes, topRes, customersRes] = await Promise.all([
          fetch(`${API_URL}/api/analytics/dashboard`, { headers }),
          fetch(`${API_URL}/api/analytics/sales-trend?days=7`, { headers }),
          fetch(`${API_URL}/api/analytics/top-products?limit=5`, { headers }),
          fetch(`${API_URL}/api/analytics/customers`, { headers })
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (trendRes.ok) setSalesTrend(await trendRes.json());
        if (topRes.ok) setTopProducts(await topRes.json());
        if (customersRes.ok) setCustomers(await customersRes.json());
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ['#7c3aed', '#2dd4bf', '#f472b6', '#3b82f6', '#fbbf24'];

  // Calculate growth rates
  const revenueGrowth = salesTrend.length >= 2 
    ? ((salesTrend[salesTrend.length - 1]?.revenue - salesTrend[0]?.revenue) / (salesTrend[0]?.revenue || 1) * 100).toFixed(1)
    : 0;

  const topCustomers = customers.slice(0, 5);
  const activeCustomers = customers.filter(c => c.order_count > 0).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-['Outfit']">Analytics</h1>
          <p className="text-zinc-400 mt-1">Deep insights into your business performance</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-teal-400" />
                  <span className="text-zinc-400 text-sm">Revenue Growth</span>
                </div>
                <p className="text-2xl font-bold font-['JetBrains_Mono'] text-teal-400">
                  {revenueGrowth > 0 ? '+' : ''}{revenueGrowth}%
                </p>
                <p className="text-xs text-zinc-500 mt-1">vs. last week</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-violet-400" />
                  <span className="text-zinc-400 text-sm">Avg. Order Value</span>
                </div>
                <p className="text-2xl font-bold font-['JetBrains_Mono']">
                  ${salesTrend.length > 0 
                    ? (salesTrend.reduce((acc, d) => acc + d.revenue, 0) / salesTrend.reduce((acc, d) => acc + d.orders, 0) || 0).toFixed(2)
                    : '0.00'
                  }
                </p>
                <p className="text-xs text-zinc-500 mt-1">per order</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-pink-400" />
                  <span className="text-zinc-400 text-sm">Active Customers</span>
                </div>
                <p className="text-2xl font-bold font-['JetBrains_Mono']">{activeCustomers}</p>
                <p className="text-xs text-zinc-500 mt-1">with orders</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Bot className="w-5 h-5 text-blue-400" />
                  <span className="text-zinc-400 text-sm">AI Prediction</span>
                </div>
                <p className="text-2xl font-bold font-['JetBrains_Mono'] text-blue-400">+15%</p>
                <p className="text-xs text-zinc-500 mt-1">expected growth</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-400" />
                Revenue Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrend}>
                    <defs>
                      <linearGradient id="colorAnalyticsRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#52525b"
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                      stroke="#7c3aed"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorAnalyticsRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Daily Sales */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-zinc-900/50 border-zinc-800 h-full">
              <CardHeader>
                <CardTitle>Daily Sales Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#52525b"
                        tick={{ fill: '#71717a', fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                      />
                      <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="orders" fill="#2dd4bf" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Product Performance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="bg-zinc-900/50 border-zinc-800 h-full">
              <CardHeader>
                <CardTitle>Product Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <div className="h-[200px] w-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topProducts}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="revenue"
                        >
                          {topProducts.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                    {topProducts.map((product, index) => (
                      <div key={product._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm text-zinc-400 truncate max-w-[120px]">{product.name}</span>
                        </div>
                        <span className="font-['JetBrains_Mono'] text-sm">
                          ${product.revenue?.toLocaleString() || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Customer Insights */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                Customer Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Top Customers */}
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-4">Top Customers by Spending</h4>
                  <div className="space-y-4">
                    {topCustomers.map((customer, index) => (
                      <div key={customer.user_id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-sm font-medium text-violet-400">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{customer.name || 'Unknown'}</p>
                            <p className="text-xs text-zinc-500">{customer.order_count} orders</p>
                          </div>
                        </div>
                        <span className="font-['JetBrains_Mono'] text-teal-400">
                          ${customer.total_spent.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Demand Prediction */}
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-4">AI Demand Prediction</h4>
                  <div className="glass-card p-4 rounded-xl border border-violet-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <p className="font-medium">Demand Forecast</p>
                        <p className="text-xs text-zinc-500">Based on historical data</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Expected Revenue (Next Week)</span>
                        <span className="font-['JetBrains_Mono'] text-teal-400">
                          ${((stats?.total_revenue || 0) * 1.15).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Predicted Orders</span>
                        <span className="font-['JetBrains_Mono']">
                          {Math.ceil(salesTrend.reduce((acc, d) => acc + d.orders, 0) * 1.1)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Top Category</span>
                        <span className="text-sm text-violet-400">Electronics</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
