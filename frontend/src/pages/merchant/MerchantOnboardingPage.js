import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import {
  Phone,
  Mail,
  Lock,
  User,
  Store,
  MapPin,
  FileText,
  CreditCard,
  Building2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShoppingBag,
  Shield,
  Sparkles
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const MerchantOnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1: Phone Verification
    phone_number: '',
    otp: '',
    
    // Step 2: Account Details
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    
    // Step 3: Business Info
    shop_name: '',
    business_category: '',
    store_address: '',
    city: '',
    state: '',
    pincode: '',
    
    // Step 4: KYC
    gstin: '',
    pan_number: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_name: '',
    account_holder_name: '',
    
    // Step 5: Plan Selection
    subscription_plan: 'starter'
  });

  const businessCategories = [
    'Grocery & Supermarket',
    'Electronics & Appliances',
    'Fashion & Apparel',
    'Health & Pharmacy',
    'Restaurant & Food',
    'Home & Garden',
    'Sports & Fitness',
    'Books & Stationery',
    'Jewelry & Accessories',
    'Other'
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu & Kashmir', 'Ladakh'
  ];

  const handleSendOTP = async () => {
    if (!formData.phone_number || formData.phone_number.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/merchant/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: formData.phone_number })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send OTP');
      }
      
      setOtpSent(true);
      toast.success('OTP sent to your phone number!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/merchant/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone_number: formData.phone_number,
          code: formData.otp 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Invalid OTP');
      }
      
      if (data.valid) {
        setPhoneVerified(true);
        toast.success('Phone number verified!');
        setStep(2);
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/merchant/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: formData.phone_number,
          email: formData.email,
          password: formData.password,
          name: formData.name,
          business_info: {
            shop_name: formData.shop_name,
            business_category: formData.business_category,
            store_address: formData.store_address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode
          },
          kyc_info: {
            gstin: formData.gstin || null,
            pan_number: formData.pan_number,
            bank_account_number: formData.bank_account_number,
            bank_ifsc: formData.bank_ifsc,
            bank_name: formData.bank_name,
            account_holder_name: formData.account_holder_name
          },
          subscription_plan: formData.subscription_plan
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }
      
      // Store token and redirect
      localStorage.setItem('token', data.token);
      toast.success('Welcome to RetailIQ! Your store is ready.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return phoneVerified;
      case 2:
        return formData.email && formData.password && formData.name && formData.password === formData.confirmPassword;
      case 3:
        return formData.shop_name && formData.business_category && formData.store_address && formData.city && formData.state && formData.pincode;
      case 4:
        return formData.pan_number && formData.bank_account_number && formData.bank_ifsc && formData.bank_name && formData.account_holder_name;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const steps = [
    { number: 1, title: 'Phone Verification', icon: Phone },
    { number: 2, title: 'Account Details', icon: User },
    { number: 3, title: 'Business Info', icon: Store },
    { number: 4, title: 'KYC Documents', icon: FileText },
    { number: 5, title: 'Select Plan', icon: CreditCard }
  ];

  return (
    <div className="min-h-screen gradient-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-violet-500" />
            <span className="text-xl font-bold font-['Outfit']">RetailIQ</span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-zinc-800">
              <div 
                className="h-full bg-violet-500 transition-all duration-500"
                style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
            
            {steps.map((s) => (
              <div key={s.number} className="relative z-10 flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step > s.number 
                      ? 'bg-violet-500 text-white' 
                      : step === s.number 
                        ? 'bg-violet-500/20 border-2 border-violet-500 text-violet-400' 
                        : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {step > s.number ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <s.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs mt-2 hidden sm:block ${step >= s.number ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="glass-card p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Phone Verification */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold font-['Outfit'] mb-2">Verify Your Phone</h2>
                  <p className="text-zinc-400">We'll send you an OTP to verify your mobile number</p>
                </div>

                <div className="space-y-4 max-w-md mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number</Label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-400">
                        +91
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="9876543210"
                          value={formData.phone_number}
                          onChange={(e) => updateFormData('phone_number', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="pl-10 bg-zinc-950/50 border-zinc-800"
                          disabled={otpSent}
                          data-testid="phone-input"
                        />
                      </div>
                    </div>
                  </div>

                  {!otpSent ? (
                    <Button 
                      onClick={handleSendOTP}
                      className="w-full btn-primary"
                      disabled={loading || formData.phone_number.length !== 10}
                      data-testid="send-otp-btn"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Send OTP
                    </Button>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="otp">Enter OTP</Label>
                        <Input
                          id="otp"
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={formData.otp}
                          onChange={(e) => updateFormData('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="text-center text-2xl tracking-widest bg-zinc-950/50 border-zinc-800"
                          maxLength={6}
                          data-testid="otp-input"
                        />
                      </div>
                      <Button 
                        onClick={handleVerifyOTP}
                        className="w-full btn-primary"
                        disabled={loading || formData.otp.length !== 6}
                        data-testid="verify-otp-btn"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Verify OTP
                      </Button>
                      <button 
                        onClick={() => { setOtpSent(false); setFormData(prev => ({ ...prev, otp: '' })); }}
                        className="w-full text-sm text-violet-400 hover:text-violet-300"
                      >
                        Resend OTP
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Account Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold font-['Outfit'] mb-2">Create Your Account</h2>
                  <p className="text-zinc-400">Set up your login credentials</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        className="pl-10 bg-zinc-950/50 border-zinc-800"
                        data-testid="name-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        className="pl-10 bg-zinc-950/50 border-zinc-800"
                        data-testid="email-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        className="pl-10 bg-zinc-950/50 border-zinc-800"
                        data-testid="password-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                        className="pl-10 bg-zinc-950/50 border-zinc-800"
                        data-testid="confirm-password-input"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Business Info */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold font-['Outfit'] mb-2">Business Information</h2>
                  <p className="text-zinc-400">Tell us about your store</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="shop_name">Shop Name</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        id="shop_name"
                        type="text"
                        placeholder="Your Store Name"
                        value={formData.shop_name}
                        onChange={(e) => updateFormData('shop_name', e.target.value)}
                        className="pl-10 bg-zinc-950/50 border-zinc-800"
                        data-testid="shop-name-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="business_category">Business Category</Label>
                    <select
                      id="business_category"
                      value={formData.business_category}
                      onChange={(e) => updateFormData('business_category', e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-md text-white"
                      data-testid="category-select"
                    >
                      <option value="">Select a category</option>
                      {businessCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="store_address">Store Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <textarea
                        id="store_address"
                        placeholder="Full store address"
                        value={formData.store_address}
                        onChange={(e) => updateFormData('store_address', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-md text-white min-h-[80px]"
                        data-testid="address-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      className="bg-zinc-950/50 border-zinc-800"
                      data-testid="city-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <select
                      id="state"
                      value={formData.state}
                      onChange={(e) => updateFormData('state', e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-md text-white"
                      data-testid="state-select"
                    >
                      <option value="">Select State</option>
                      {indianStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      type="text"
                      placeholder="400001"
                      value={formData.pincode}
                      onChange={(e) => updateFormData('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="bg-zinc-950/50 border-zinc-800"
                      maxLength={6}
                      data-testid="pincode-input"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: KYC Documents */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold font-['Outfit'] mb-2">KYC Documentation</h2>
                  <p className="text-zinc-400">Required for GST-compliant invoicing and payouts</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN (Optional)</Label>
                    <Input
                      id="gstin"
                      type="text"
                      placeholder="22AAAAA0000A1Z5"
                      value={formData.gstin}
                      onChange={(e) => updateFormData('gstin', e.target.value.toUpperCase())}
                      className="bg-zinc-950/50 border-zinc-800"
                      data-testid="gstin-input"
                    />
                    <p className="text-xs text-zinc-500">Optional for small retailers under threshold</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pan_number">PAN Number *</Label>
                    <Input
                      id="pan_number"
                      type="text"
                      placeholder="ABCDE1234F"
                      value={formData.pan_number}
                      onChange={(e) => updateFormData('pan_number', e.target.value.toUpperCase().slice(0, 10))}
                      className="bg-zinc-950/50 border-zinc-800"
                      maxLength={10}
                      data-testid="pan-input"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-4 border-t border-zinc-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-violet-400" />
                      Bank Account Details
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_holder_name">Account Holder Name *</Label>
                    <Input
                      id="account_holder_name"
                      type="text"
                      placeholder="As per bank records"
                      value={formData.account_holder_name}
                      onChange={(e) => updateFormData('account_holder_name', e.target.value)}
                      className="bg-zinc-950/50 border-zinc-800"
                      data-testid="account-holder-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name *</Label>
                    <Input
                      id="bank_name"
                      type="text"
                      placeholder="HDFC Bank"
                      value={formData.bank_name}
                      onChange={(e) => updateFormData('bank_name', e.target.value)}
                      className="bg-zinc-950/50 border-zinc-800"
                      data-testid="bank-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank_account_number">Account Number *</Label>
                    <Input
                      id="bank_account_number"
                      type="text"
                      placeholder="0000000000000"
                      value={formData.bank_account_number}
                      onChange={(e) => updateFormData('bank_account_number', e.target.value.replace(/\D/g, ''))}
                      className="bg-zinc-950/50 border-zinc-800"
                      data-testid="account-number-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank_ifsc">IFSC Code *</Label>
                    <Input
                      id="bank_ifsc"
                      type="text"
                      placeholder="HDFC0000001"
                      value={formData.bank_ifsc}
                      onChange={(e) => updateFormData('bank_ifsc', e.target.value.toUpperCase().slice(0, 11))}
                      className="bg-zinc-950/50 border-zinc-800"
                      maxLength={11}
                      data-testid="ifsc-input"
                    />
                  </div>
                </div>

                <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-zinc-300">Your data is secure</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        We use bank-grade encryption to protect your sensitive information. 
                        Your data is never shared with third parties.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Plan Selection */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold font-['Outfit'] mb-2">Choose Your Plan</h2>
                  <p className="text-zinc-400">Start free, upgrade anytime</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Starter Plan */}
                  <div 
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.subscription_plan === 'starter' 
                        ? 'border-violet-500 bg-violet-500/10' 
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                    onClick={() => updateFormData('subscription_plan', 'starter')}
                    data-testid="plan-starter"
                  >
                    <h3 className="text-xl font-bold mb-2">Starter</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">Free</span>
                    </div>
                    <ul className="space-y-2 text-sm text-zinc-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-400" />
                        Up to 50 products
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-400" />
                        Basic analytics
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-400" />
                        Email support
                      </li>
                    </ul>
                  </div>

                  {/* Pro Plan */}
                  <div 
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all relative ${
                      formData.subscription_plan === 'pro' 
                        ? 'border-violet-500 bg-violet-500/10' 
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                    onClick={() => updateFormData('subscription_plan', 'pro')}
                    data-testid="plan-pro"
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-violet-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        POPULAR
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Pro</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">₹999</span>
                      <span className="text-zinc-500">/month</span>
                    </div>
                    <ul className="space-y-2 text-sm text-zinc-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-400" />
                        Unlimited products
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-400" />
                        Smart Reorder alerts
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-400" />
                        AI analytics
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-400" />
                        Priority support
                      </li>
                    </ul>
                  </div>

                  {/* Enterprise Plan */}
                  <div 
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.subscription_plan === 'enterprise' 
                        ? 'border-violet-500 bg-violet-500/10' 
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                    onClick={() => updateFormData('subscription_plan', 'enterprise')}
                    data-testid="plan-enterprise"
                  >
                    <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">₹2,999</span>
                      <span className="text-zinc-500">/month</span>
                    </div>
                    <ul className="space-y-2 text-sm text-zinc-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-400" />
                        Everything in Pro
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-400" />
                        API access
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-400" />
                        Dedicated manager
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-400" />
                        Multi-store
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                  <p className="text-sm text-zinc-300 text-center">
                    <strong>Pro-Tip:</strong> Start with Starter and upgrade anytime. 
                    You'll get 14 days free trial of Pro features!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-zinc-800">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="border-zinc-700"
                data-testid="prev-btn"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
            
            {step === 1 && <div />}
            
            {step < 5 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="btn-primary ml-auto"
                data-testid="next-btn"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary ml-auto"
                data-testid="submit-btn"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Complete Setup
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantOnboardingPage;
