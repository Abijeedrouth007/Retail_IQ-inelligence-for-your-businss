import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Loader2,
  ArrowLeft,
  ShoppingBag,
  Gift
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, signup, loginWithGoogle, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [referralCode, setReferralCode] = useState('');

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    phone: '' 
  });

  const from = location.state?.from?.pathname || '/dashboard';

  // Check for referral code in URL
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
      setActiveTab('signup'); // Switch to signup tab
      toast.success(`Referral code ${ref.toUpperCase()} applied! Sign up to get ₹50 credit.`);
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(loginData.email, loginData.password);
      toast.success('Welcome back!');
      navigate(user.role === 'admin' ? '/dashboard' : '/store', { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupData.phone && signupData.phone.startsWith('0')) {
      toast.error('Phone number cannot start with 0');
      return;
    }
    setLoading(true);
    try {
      await signup(signupData.email, signupData.password, signupData.name, signupData.phone);
      
      // Apply referral code if present
      if (referralCode) {
        try {
          const newToken = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/api/referral/apply?referral_code=${referralCode}`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          });
          const data = await response.json();
          if (response.ok) {
            toast.success(data.message);
          }
        } catch (refError) {
          console.error('Failed to apply referral:', refError);
        }
      }
      
      toast.success('Account created successfully!');
      navigate('/store', { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo and back button */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            data-testid="back-to-home-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-violet-500" />
            <span className="text-xl font-bold font-['Outfit']">RetailIQ</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="glass-card p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold font-['Outfit'] mb-2">
              {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-zinc-400 text-sm">
              {activeTab === 'login' 
                ? 'Sign in to your RetailIQ account' 
                : 'Start managing your retail business'}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-zinc-900">
              <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
              <TabsTrigger value="signup" data-testid="signup-tab">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="pl-10 bg-zinc-950/50 border-zinc-800"
                      required
                      data-testid="login-email-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="pl-10 bg-zinc-950/50 border-zinc-800"
                      required
                      data-testid="login-password-input"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-primary"
                  disabled={loading}
                  data-testid="login-submit-btn"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signupData.name}
                      onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                      className="pl-10 bg-zinc-950/50 border-zinc-800"
                      required
                      data-testid="signup-name-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      className="pl-10 bg-zinc-950/50 border-zinc-800"
                      required
                      data-testid="signup-email-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="1234567890"
                      value={signupData.phone}
                      onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                      className="pl-10 bg-zinc-950/50 border-zinc-800"
                      data-testid="signup-phone-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      className="pl-10 bg-zinc-950/50 border-zinc-800"
                      required
                      minLength={6}
                      data-testid="signup-password-input"
                    />
                  </div>
                </div>

                {/* Referral Code */}
                <div className="space-y-2">
                  <Label htmlFor="referral-code">Referral Code (Optional)</Label>
                  <div className="relative">
                    <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      id="referral-code"
                      type="text"
                      placeholder="Enter referral code"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="pl-10 bg-zinc-950/50 border-zinc-800 uppercase"
                      maxLength={8}
                      data-testid="referral-code-input"
                    />
                  </div>
                  {referralCode && (
                    <p className="text-xs text-teal-400">Get ₹50 credit on signup!</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-primary"
                  disabled={loading}
                  data-testid="signup-submit-btn"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900/50 px-2 text-zinc-500">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-zinc-700 hover:bg-zinc-800"
            onClick={handleGoogleLogin}
            data-testid="google-login-btn"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Admin Demo Credentials */}
          <div className="mt-6 p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg" data-testid="demo-credentials">
            <p className="text-center text-sm text-zinc-300 font-medium mb-2">
              Admin Demo Login
            </p>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-zinc-400">Email:</span>
              <code className="bg-zinc-800 px-2 py-1 rounded text-violet-400 font-mono text-xs">admin@retailiq.com</code>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm mt-1">
              <span className="text-zinc-400">Password:</span>
              <code className="bg-zinc-800 px-2 py-1 rounded text-violet-400 font-mono text-xs">admin123</code>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
