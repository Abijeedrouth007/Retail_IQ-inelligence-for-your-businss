import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Gift,
  Users,
  Copy,
  CheckCircle,
  Share2,
  TrendingUp,
  IndianRupee,
  Crown,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ReferralPage = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [statsRes, historyRes, leaderboardRes, creditsRes] = await Promise.all([
        fetch(`${API_URL}/api/referral/stats`, { headers }),
        fetch(`${API_URL}/api/referral/history`, { headers }),
        fetch(`${API_URL}/api/referral/leaderboard`, { headers }),
        fetch(`${API_URL}/api/referral/credits`, { headers })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (historyRes.ok) setHistory(await historyRes.json());
      if (leaderboardRes.ok) setLeaderboard(await leaderboardRes.json());
      if (creditsRes.ok) setCredits(await creditsRes.json());
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (stats?.referral_code) {
      navigator.clipboard.writeText(stats.referral_code);
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyReferralLink = () => {
    if (stats?.referral_link) {
      const link = `${window.location.origin}/auth?ref=${stats.referral_code}`;
      navigator.clipboard.writeText(link);
      toast.success('Referral link copied!');
    }
  };

  const shareReferral = () => {
    const link = `${window.location.origin}/auth?ref=${stats?.referral_code}`;
    const text = `Join RetailIQ and get ₹50 credit on your first order! Use my referral code: ${stats?.referral_code}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join RetailIQ',
        text: text,
        url: link
      }).catch(() => {});
    } else {
      copyReferralLink();
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-['Outfit']">Referral Program</h1>
          <p className="text-zinc-400 mt-1">Invite friends and earn rewards together</p>
        </div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-violet-600/20 via-violet-500/10 to-teal-500/20 rounded-2xl p-8 border border-violet-500/30"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Share & Earn</h2>
                  <p className="text-zinc-400 text-sm">Get ₹100 for every successful referral</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="bg-zinc-900/80 rounded-lg px-4 py-2 border border-zinc-700">
                  <p className="text-xs text-zinc-500 mb-1">Your Referral Code</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-['JetBrains_Mono'] text-violet-400">
                      {stats?.referral_code || '---'}
                    </span>
                    <button
                      onClick={copyReferralCode}
                      className="p-1 hover:bg-zinc-800 rounded transition-colors"
                      data-testid="copy-code-btn"
                    >
                      {copied ? (
                        <CheckCircle className="w-5 h-5 text-teal-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-zinc-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={copyReferralLink} variant="outline" className="border-zinc-700">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button onClick={shareReferral} className="btn-primary">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              <div className="text-center p-4 bg-zinc-900/50 rounded-xl">
                <p className="text-3xl font-bold text-teal-400">₹100</p>
                <p className="text-xs text-zinc-500 mt-1">You Earn</p>
              </div>
              <div className="text-center p-4 bg-zinc-900/50 rounded-xl">
                <p className="text-3xl font-bold text-violet-400">₹50</p>
                <p className="text-xs text-zinc-500 mt-1">Friend Gets</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-violet-400" />
              <span className="text-xs text-zinc-500">Total</span>
            </div>
            <p className="text-3xl font-bold">{stats?.total_referrals || 0}</p>
            <p className="text-zinc-400 text-sm">Total Referrals</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-teal-400" />
              <span className="text-xs text-zinc-500">Completed</span>
            </div>
            <p className="text-3xl font-bold text-teal-400">{stats?.successful_referrals || 0}</p>
            <p className="text-zinc-400 text-sm">Successful</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-yellow-400" />
              <span className="text-xs text-zinc-500">Pending</span>
            </div>
            <p className="text-3xl font-bold text-yellow-400">{stats?.pending_referrals || 0}</p>
            <p className="text-zinc-400 text-sm">Pending</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <IndianRupee className="w-8 h-8 text-green-400" />
              <span className="text-xs text-zinc-500">Earned</span>
            </div>
            <p className="text-3xl font-bold text-green-400">
              ₹{(credits?.total_credits || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-zinc-400 text-sm">Available Credits</p>
          </motion.div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Referral History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-400" />
              Referral History
            </h3>
            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-violet-400">
                          {item.referred_user_name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{item.referred_user_name}</p>
                        <p className="text-xs text-zinc-500">{item.referred_user_email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'completed' 
                          ? 'bg-teal-500/20 text-teal-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {item.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                      {item.status === 'completed' && (
                        <p className="text-teal-400 text-sm mt-1">+₹{item.credits_earned}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No referrals yet</p>
                <p className="text-sm mt-1">Share your code to start earning!</p>
              </div>
            )}
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              Top Referrers
            </h3>
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((entry, i) => (
                  <div 
                    key={i} 
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                      i === 1 ? 'bg-zinc-400/10 border border-zinc-400/30' :
                      i === 2 ? 'bg-amber-600/10 border border-amber-600/30' :
                      'bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        i === 0 ? 'bg-yellow-500 text-black' :
                        i === 1 ? 'bg-zinc-400 text-black' :
                        i === 2 ? 'bg-amber-600 text-black' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {entry.rank}
                      </div>
                      <span className="font-medium">{entry.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{entry.successful_referrals} referrals</p>
                      <p className="text-xs text-teal-400">₹{entry.credits_earned} earned</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <Crown className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No referrals yet</p>
                <p className="text-sm mt-1">Be the first on the leaderboard!</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-violet-400" />
              </div>
              <h4 className="font-semibold mb-2">1. Share Your Code</h4>
              <p className="text-sm text-zinc-400">
                Share your unique referral code with friends and fellow shop owners
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-teal-400" />
              </div>
              <h4 className="font-semibold mb-2">2. Friends Sign Up</h4>
              <p className="text-sm text-zinc-400">
                They get ₹50 welcome credit when they use your code during signup
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-green-400" />
              </div>
              <h4 className="font-semibold mb-2">3. You Earn ₹100</h4>
              <p className="text-sm text-zinc-400">
                When they complete their first order, you get ₹100 credit!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ReferralPage;
