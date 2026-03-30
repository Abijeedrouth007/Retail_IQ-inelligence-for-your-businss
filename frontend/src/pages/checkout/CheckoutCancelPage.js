import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { XCircle, ShoppingBag, RefreshCw } from 'lucide-react';

const CheckoutCancelPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold font-['Outfit'] mb-2">Payment Cancelled</h1>
            <p className="text-zinc-400 mb-6">
              Your payment was cancelled. No charges were made.
            </p>

            {orderId && (
              <p className="text-sm text-zinc-500 mb-6">
                Order ID: {orderId.slice(0, 16)}...
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/cart')}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                className="flex-1 btn-primary"
                onClick={() => navigate('/store')}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CheckoutCancelPage;
