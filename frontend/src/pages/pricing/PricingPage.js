import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import {
  ShoppingBag,
  Check,
  ArrowRight,
  Sparkles,
  Zap,
  Crown,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const PricingPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscription/plans`);
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      // Use fallback plans
      setPlans([
        {
          plan_id: 'starter',
          name: 'Starter',
          price: 0,
          currency: 'INR',
          features: ['Up to 50 products', 'Basic analytics', 'Email support', '1 user account'],
          product_limit: 50,
          is_popular: false
        },
        {
          plan_id: 'pro',
          name: 'Pro',
          price: 999,
          currency: 'INR',
          features: ['Unlimited products', 'Advanced AI analytics', 'Smart Reorder alerts', 'Priority support', '5 user accounts', 'Custom reports'],
          product_limit: null,
          is_popular: true
        },
        {
          plan_id: 'enterprise',
          name: 'Enterprise',
          price: 2999,
          currency: 'INR',
          features: ['Everything in Pro', 'API access', 'Dedicated manager', 'Custom integrations', 'Unlimited users', 'Multi-store management'],
          product_limit: null,
          is_popular: false
        }
      ]);
    }
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'starter': return Zap;
      case 'pro': return Sparkles;
      case 'enterprise': return Crown;
      default: return Zap;
    }
  };

  const faqs = [
    {
      question: 'Can I switch plans later?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll be prorated for the remaining days. When downgrading, changes take effect at the next billing cycle.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes, all new merchants get a 14-day free trial of Pro features, even on the Starter plan. No credit card required.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit/debit cards, UPI, net banking, and wallet payments through our secure payment partner.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Absolutely. There are no long-term contracts. You can cancel your subscription at any time, and you\'ll retain access until the end of your billing period.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/80 backdrop-blur-lg border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-7 h-7 text-violet-500" />
                <span className="text-xl font-bold font-['Outfit']">RetailIQ</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth')}
                className="text-zinc-400 hover:text-white"
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate('/merchant/onboarding')}
                className="btn-primary rounded-full px-6"
                data-testid="header-get-started-btn"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-['Outfit'] mb-6">
              Simple, Transparent
              <span className="block bg-gradient-to-r from-violet-400 to-teal-400 bg-clip-text text-transparent">
                Pricing
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
              Start free, scale as you grow. No hidden fees, no surprises.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center p-1 bg-zinc-900 rounded-full mb-12">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === 'monthly' 
                    ? 'bg-violet-500 text-white' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  billingPeriod === 'yearly' 
                    ? 'bg-violet-500 text-white' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Yearly
                <span className="px-2 py-0.5 bg-teal-500 text-white text-xs rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              const PlanIcon = getPlanIcon(plan.plan_id);
              const price = billingPeriod === 'yearly' 
                ? Math.round(plan.price * 12 * 0.8) 
                : plan.price;
              
              return (
                <motion.div
                  key={plan.plan_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-2xl p-8 ${
                    plan.is_popular 
                      ? 'bg-gradient-to-b from-violet-500/20 to-transparent border-2 border-violet-500' 
                      : 'bg-zinc-900/50 border border-zinc-800'
                  }`}
                  data-testid={`pricing-card-${plan.plan_id}`}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1.5 bg-violet-500 text-white text-sm font-bold rounded-full flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      plan.is_popular ? 'bg-violet-500' : 'bg-zinc-800'
                    }`}>
                      <PlanIcon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold font-['Outfit']">{plan.name}</h3>
                  </div>

                  <div className="mb-6">
                    {price === 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold">Free</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-zinc-400">₹</span>
                        <span className="text-5xl font-bold font-['JetBrains_Mono']">
                          {price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-zinc-400">
                          /{billingPeriod === 'yearly' ? 'year' : 'month'}
                        </span>
                      </div>
                    )}
                    {billingPeriod === 'yearly' && plan.price > 0 && (
                      <p className="text-sm text-teal-400 mt-2">
                        Save ₹{(plan.price * 12 * 0.2).toLocaleString('en-IN')}/year
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => navigate('/merchant/onboarding')}
                    className={`w-full mb-8 ${
                      plan.is_popular 
                        ? 'btn-primary' 
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    }`}
                    data-testid={`select-plan-${plan.plan_id}`}
                  >
                    {plan.price === 0 ? 'Start Free' : 'Get Started'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <ul className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                        <span className="text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 px-6 lg:px-12 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold font-['Outfit'] text-center mb-12">
            Compare All Features
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-4 px-4 text-zinc-400 font-medium">Feature</th>
                  <th className="text-center py-4 px-4 text-zinc-400 font-medium">Starter</th>
                  <th className="text-center py-4 px-4 text-violet-400 font-medium">Pro</th>
                  <th className="text-center py-4 px-4 text-zinc-400 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Products', starter: '50', pro: 'Unlimited', enterprise: 'Unlimited' },
                  { feature: 'User Accounts', starter: '1', pro: '5', enterprise: 'Unlimited' },
                  { feature: 'Analytics Dashboard', starter: 'Basic', pro: 'Advanced', enterprise: 'Advanced' },
                  { feature: 'AI Insights', starter: false, pro: true, enterprise: true },
                  { feature: 'Smart Reorder Alerts', starter: false, pro: true, enterprise: true },
                  { feature: 'Inventory Forecasting', starter: false, pro: true, enterprise: true },
                  { feature: 'Custom Reports', starter: false, pro: true, enterprise: true },
                  { feature: 'API Access', starter: false, pro: false, enterprise: true },
                  { feature: 'Multi-Store', starter: false, pro: false, enterprise: true },
                  { feature: 'Dedicated Manager', starter: false, pro: false, enterprise: true },
                  { feature: 'Support', starter: 'Email', pro: 'Priority', enterprise: '24/7 Phone' }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    <td className="py-4 px-4 text-zinc-300">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      {typeof row.starter === 'boolean' ? (
                        row.starter ? (
                          <Check className="w-5 h-5 text-teal-400 mx-auto" />
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )
                      ) : (
                        <span className="text-zinc-400">{row.starter}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center bg-violet-500/5">
                      {typeof row.pro === 'boolean' ? (
                        row.pro ? (
                          <Check className="w-5 h-5 text-teal-400 mx-auto" />
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )
                      ) : (
                        <span className="text-white font-medium">{row.pro}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {typeof row.enterprise === 'boolean' ? (
                        row.enterprise ? (
                          <Check className="w-5 h-5 text-teal-400 mx-auto" />
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )
                      ) : (
                        <span className="text-zinc-400">{row.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 lg:px-12 bg-zinc-900/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-['Outfit'] text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
              >
                <h3 className="font-semibold text-lg mb-2 flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  {faq.question}
                </h3>
                <p className="text-zinc-400 pl-8">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 lg:p-16 text-center rounded-3xl"
          >
            <h2 className="text-3xl lg:text-4xl font-bold font-['Outfit'] mb-4">
              Ready to Grow Your Business?
            </h2>
            <p className="text-zinc-400 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of retailers already using RetailIQ. Start your free trial today.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/merchant/onboarding')}
              className="btn-primary rounded-full px-10 py-6 text-lg"
              data-testid="cta-get-started-btn"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-zinc-500 text-sm mt-4">No credit card required</p>
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

export default PricingPage;
