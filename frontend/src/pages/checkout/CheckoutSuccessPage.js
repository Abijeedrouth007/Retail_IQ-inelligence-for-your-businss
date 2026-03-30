import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { CheckCircle, XCircle, Loader2, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency, useConfig } from '../../contexts/ConfigContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currencySymbol } = useConfig();
  const [status, setStatus] = useState('loading');
  const [orderDetails, setOrderDetails] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const pollStatus = async (attempts = 0) => {
      const maxAttempts = 10;
      const token = localStorage.getItem('token');

      if (attempts >= maxAttempts) {
        setStatus('timeout');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/checkout/status/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          
          if (data.payment_status === 'paid') {
            setStatus('success');
            setOrderDetails(data);
            return;
          } else if (data.status === 'expired') {
            setStatus('expired');
            return;
          }
        }

        // Continue polling
        setTimeout(() => pollStatus(attempts + 1), 2000);
      } catch (error) {
        console.error('Error checking status:', error);
        setTimeout(() => pollStatus(attempts + 1), 2000);
      }
    };

    pollStatus();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-8 text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="w-16 h-16 text-violet-500 animate-spin mx-auto mb-4" />
                <h1 className="text-2xl font-bold font-['Outfit'] mb-2">Processing Payment</h1>
                <p className="text-zinc-400">Please wait while we confirm your payment...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-20 h-20 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-teal-400" />
                </div>
                <h1 className="text-2xl font-bold font-['Outfit'] mb-2">Payment Successful!</h1>
                <p className="text-zinc-400 mb-6">Thank you for your purchase.</p>
                
                {orderDetails && (
                  <div className="bg-zinc-800/50 rounded-xl p-4 mb-6 text-left">
                    <div className="flex justify-between mb-2">
                      <span className="text-zinc-400">Order ID</span>
                      <span className="font-['JetBrains_Mono'] text-sm">{orderDetails.order_id?.slice(0, 16)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Amount Paid</span>
                      <span className="font-['JetBrains_Mono'] text-teal-400">
                        {formatCurrency(orderDetails.amount, currencySymbol)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate('/orders')}
                  >
                    View Orders
                  </Button>
                  <Button
                    className="flex-1 btn-primary"
                    onClick={() => navigate('/store')}
                  >
                    Continue Shopping
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {(status === 'error' || status === 'expired' || status === 'timeout') && (
              <>
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-10 h-10 text-red-400" />
                </div>
                <h1 className="text-2xl font-bold font-['Outfit'] mb-2">
                  {status === 'expired' ? 'Payment Expired' : 'Payment Failed'}
                </h1>
                <p className="text-zinc-400 mb-6">
                  {status === 'expired' 
                    ? 'Your payment session has expired. Please try again.'
                    : 'Something went wrong with your payment.'}
                </p>
                <Button
                  className="btn-primary"
                  onClick={() => navigate('/store')}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Return to Store
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CheckoutSuccessPage;
