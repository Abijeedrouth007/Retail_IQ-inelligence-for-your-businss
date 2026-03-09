import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import {
  ShoppingBag,
  BarChart3,
  Package,
  Users,
  Bot,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Globe
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BarChart3,
      title: 'AI-Powered Analytics',
      description: 'Get intelligent insights on sales trends, demand forecasting, and customer behavior.'
    },
    {
      icon: Package,
      title: 'Smart Inventory',
      description: 'Automated stock alerts, reorder suggestions, and real-time tracking.'
    },
    {
      icon: Users,
      title: 'Customer Insights',
      description: 'Understand your customers with detailed purchase history and preferences.'
    },
    {
      icon: Bot,
      title: 'AI Assistant',
      description: 'Get instant answers and recommendations from our AI chatbot.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% uptime guarantee.'
    },
    {
      icon: Globe,
      title: 'Multi-Store Ready',
      description: 'Manage multiple locations from a single dashboard.'
    }
  ];

  const stats = [
    { value: '10K+', label: 'Active Stores' },
    { value: '$2M+', label: 'Daily Transactions' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'AI Support' }
  ];

  return (
    <div className="min-h-screen bg-[#09090b] overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/80 backdrop-blur-lg border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-7 h-7 text-violet-500" />
              <span className="text-xl font-bold font-['Outfit']">RetailIQ</span>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth')}
                className="text-zinc-400 hover:text-white"
                data-testid="nav-login-btn"
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                className="btn-primary rounded-full px-6"
                data-testid="nav-get-started-btn"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero pt-32 pb-20 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-8"
            >
              <Zap className="w-4 h-4" />
              <span>AI-Powered Retail Management</span>
            </motion.div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold font-['Outfit'] mb-6 leading-tight">
              The Brain Behind
              <span className="block bg-gradient-to-r from-violet-400 via-violet-500 to-teal-400 bg-clip-text text-transparent">
                Your Storefront
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Transform your retail business with intelligent inventory management, 
              AI-driven analytics, and seamless customer experiences.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg"
                onClick={() => navigate('/auth')}
                className="btn-primary rounded-full px-8 py-6 text-lg"
                data-testid="hero-get-started-btn"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/auth')}
                className="rounded-full px-8 py-6 text-lg border-zinc-700 hover:bg-zinc-800"
                data-testid="hero-demo-btn"
              >
                View Demo
              </Button>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent z-10 pointer-events-none" />
            <div className="glass-card p-4 lg:p-8 glow-primary">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Revenue', value: '$124,500', change: '+12.5%' },
                  { label: 'Orders', value: '1,234', change: '+8.2%' },
                  { label: 'Products', value: '456', change: '+5.1%' },
                  { label: 'Customers', value: '2,847', change: '+15.3%' }
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="bg-zinc-900/50 rounded-xl p-4 lg:p-6"
                  >
                    <p className="text-zinc-500 text-sm mb-1">{stat.label}</p>
                    <p className="text-xl lg:text-2xl font-bold font-['JetBrains_Mono']">{stat.value}</p>
                    <span className="text-teal-400 text-sm">{stat.change}</span>
                  </motion.div>
                ))}
              </div>
              <div className="h-48 lg:h-64 bg-zinc-900/50 rounded-xl flex items-center justify-center">
                <div className="flex items-center gap-4 text-zinc-600">
                  <BarChart3 className="w-12 h-12" />
                  <span className="text-lg">Interactive Analytics Dashboard</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 lg:px-12 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl lg:text-4xl font-bold font-['Outfit'] text-violet-400 mb-2">
                  {stat.value}
                </p>
                <p className="text-zinc-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-5xl font-bold font-['Outfit'] mb-4">
              Everything You Need
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Powerful features designed specifically for modern retail businesses
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="feature-card p-6 lg:p-8 rounded-2xl"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold font-['Outfit'] mb-2">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Demo Section */}
      <section className="py-20 lg:py-32 px-6 lg:px-12 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-5xl font-bold font-['Outfit'] mb-6">
                Meet Your AI
                <span className="block text-violet-400">Business Partner</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                Our AI assistant analyzes your sales data, predicts demand, and provides 
                actionable insights to grow your business.
              </p>
              <ul className="space-y-4">
                {[
                  'Smart inventory recommendations',
                  'Sales trend predictions',
                  'Customer behavior analysis',
                  '24/7 instant support'
                ].map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 text-zinc-300"
                  >
                    <CheckCircle className="w-5 h-5 text-teal-400 flex-shrink-0" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-2xl"
            >
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="font-medium">RetailIQ Assistant</p>
                  <p className="text-xs text-zinc-500">AI-Powered</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-zinc-800/50 rounded-xl p-4 max-w-[80%]">
                  <p className="text-sm text-zinc-300">What are my best selling products this week?</p>
                </div>
                <div className="bg-violet-500/10 rounded-xl p-4 max-w-[90%] ml-auto">
                  <p className="text-sm text-zinc-300">
                    Based on this week's sales data, your top 3 products are:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                    <li>1. Wireless Earbuds - 47 units ($3,759)</li>
                    <li>2. Smart Watch - 23 units ($6,899)</li>
                    <li>3. Cotton T-Shirt - 89 units ($2,224)</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 lg:p-16 text-center rounded-3xl glow-primary"
          >
            <h2 className="text-3xl lg:text-5xl font-bold font-['Outfit'] mb-6">
              Ready to Transform
              <span className="block text-violet-400">Your Business?</span>
            </h2>
            <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
              Join thousands of retailers already using RetailIQ to grow their business.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="btn-primary rounded-full px-10 py-6 text-lg"
              data-testid="cta-get-started-btn"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-zinc-500 text-sm mt-6">No credit card required</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-12 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-violet-500" />
              <span className="font-bold font-['Outfit']">RetailIQ</span>
            </div>
            <p className="text-zinc-500 text-sm">
              © 2024 RetailIQ. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
