import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import StoreMap from '../../components/maps/StoreMap';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  MapPin
} from 'lucide-react';
import { formatCurrency, useConfig } from '../../contexts/ConfigContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CustomTooltip = ({ active, payload, label, currencySymbol }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name === 'revenue' ? formatCurrency(entry.value, currencySymbol) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const KPICard = ({ title, value, change, icon: Icon, trend, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Card className="kpi-card bg-zinc-900/50 border-zinc-800 hover:border-violet-500/30">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-zinc-400 text-sm mb-1">{title}</p>
            <p className="text-2xl lg:text-3xl font-bold font-['JetBrains_Mono']">{value}</p>
            {change && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-teal-400' : 'text-red-400'}`}>
                {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{change}</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            title === 'Low Stock' ? 'bg-amber-500/10' : 'bg-violet-500/10'
          }`}>
            <Icon className={`w-6 h-6 ${title === 'Low Stock' ? 'text-amber-400' : 'text-violet-400'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const DashboardPage = () => {
  const { currencySymbol } = useConfig();
  const [stats, setStats] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const [statsRes, trendRes, topRes, lowStockRes] = await Promise.all([
          fetch(`${API_URL}/api/analytics/dashboard`, { headers }),
          fetch(`${API_URL}/api/analytics/sales-trend?days=7`, { headers }),
          fetch(`${API_URL}/api/analytics/top-products?limit=5`, { headers }),
          fetch(`${API_URL}/api/analytics/low-stock`, { headers })
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (trendRes.ok) setSalesTrend(await trendRes.json());
        if (topRes.ok) setTopProducts(await topRes.json());
        if (lowStockRes.ok) setLowStock(await lowStockRes.json());
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ['#7c3aed', '#2dd4bf', '#f472b6', '#3b82f6', '#fbbf24'];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-['Outfit']">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Welcome back! Here's your store overview.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <KPICard
            title="Total Revenue"
            value={stats ? formatCurrency(stats.total_revenue, currencySymbol) : `${currencySymbol}0`}
            change="+12.5% from last month"
            icon={DollarSign}
            trend="up"
            delay={0}
          />
          <KPICard
            title="Today's Orders"
            value={stats?.today_orders || 0}
            change="+8.2% from yesterday"
            icon={ShoppingCart}
            trend="up"
            delay={0.1}
          />
          <KPICard
            title="Total Products"
            value={stats?.total_products || 0}
            icon={Package}
            delay={0.2}
          />
          <KPICard
            title="Low Stock"
            value={stats?.low_stock_count || 0}
            icon={AlertTriangle}
            delay={0.3}
          />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue Chart - Large */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="bg-zinc-900/50 border-zinc-800 h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Revenue Trend</span>
                  <span className="text-sm font-normal text-zinc-400">Last 7 days</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrend}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
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
                        tickFormatter={(value) => `${currencySymbol}${value}`}
                      />
                      <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-zinc-900/50 border-zinc-800 h-full">
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topProducts}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="revenue"
                        nameKey="name"
                      >
                        {topProducts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {topProducts.slice(0, 3).map((product, index) => (
                    <div key={product._id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        <span className="text-zinc-400 truncate max-w-[120px]">{product.name}</span>
                      </div>
                      <span className="font-['JetBrains_Mono'] text-zinc-300">
                        {formatCurrency(product.revenue || 0, currencySymbol)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Orders Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle>Daily Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
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
                      <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
                      <Bar dataKey="orders" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Low Stock Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Low Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[250px] overflow-y-auto">
                  {lowStock.length === 0 ? (
                    <p className="text-zinc-500 text-center py-8">No low stock alerts</p>
                  ) : (
                    lowStock.map((product) => (
                      <div
                        key={product.product_id}
                        className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-700/50 overflow-hidden">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-full h-full p-2 text-zinc-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-zinc-500">{product.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-['JetBrains_Mono'] text-sm ${
                            product.stock_quantity <= 5 ? 'text-red-400' : 'text-amber-400'
                          }`}>
                            {product.stock_quantity} left
                          </p>
                          <p className="text-xs text-zinc-500">Min: {product.reorder_level}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Store Locations Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-violet-400" />
                Store Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StoreMap height="350px" />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
