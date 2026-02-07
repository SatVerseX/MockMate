import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';
import { useBilling } from '../hooks/useBilling';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  CreditCard,
  Crown,
  Zap,
  ExternalLink,
  LogOut,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ProfileScreenProps {
  onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { subscription, planTier, isPro, loading } = useBilling();

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
      navigate('/');
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanDisplayName = () => {
    switch (planTier) {
      case 'pro_yearly': return 'Pro Yearly';
      case 'pro_monthly': return 'Pro Monthly';
      case 'starter': return 'Starter';
      case 'one_day': return 'One Day Pass';
      default: return 'Free';
    }
  };

  const getPlanBadgeColor = () => {
    if (isPro) return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
    if (planTier === 'starter') return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white';
    if (planTier === 'one_day') return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
    return 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300';
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return null;
    switch (subscription.status) {
      case 'active': return { label: 'Active', color: 'text-emerald-500', icon: CheckCircle2 };
      case 'cancelled': return { label: 'Cancelled', color: 'text-red-500', icon: AlertCircle };
      case 'expired': return { label: 'Expired', color: 'text-zinc-500', icon: AlertCircle };
      default: return { label: subscription.status, color: 'text-zinc-500', icon: Clock };
    }
  };

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="glow-orb glow-orb-purple w-[300px] h-[300px] top-0 right-0 opacity-10 dark:opacity-15" />
        <div className="glow-orb glow-orb-blue w-[200px] h-[200px] bottom-1/4 left-0 opacity-10 dark:opacity-10" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-200 dark:border-white/5 px-6 py-4 lg:px-12 bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          
          <h1 className="text-lg font-semibold flex items-center gap-2 text-zinc-900 dark:text-white">
            <User className="w-5 h-5" />
            Profile
          </h1>

          <div className="w-16" />
        </div>
      </header>

      <main className="relative z-10 px-6 py-8 lg:px-12">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Profile Card */}
          <div className="glass-card p-6 fade-in-up bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {profile?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                    {profile?.fullName || 'User'}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPlanBadgeColor()}`}>
                    {isPro && <Crown className="w-3 h-3 inline mr-1" />}
                    {getPlanDisplayName()}
                  </span>
                </div>
                <p className="text-zinc-500 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user?.email || 'No email'}
                </p>
                <p className="text-sm text-zinc-400 mt-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Member since {formatDate(user?.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          <div className="glass-card p-6 fade-in-up bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Subscription
              </h2>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
            </div>
            
            {subscription ? (
              <div className="space-y-4">
                {/* Plan Info */}
                <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-white">Current Plan</div>
                      <div className="text-sm text-zinc-500">{getPlanDisplayName()}</div>
                    </div>
                  </div>
                  {subscriptionStatus && (
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${subscriptionStatus.color}`}>
                      <subscriptionStatus.icon className="w-4 h-4" />
                      {subscriptionStatus.label}
                    </div>
                  )}
                </div>

                {/* Billing Period */}
                {subscription.current_period_end && (
                  <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-zinc-500" />
                      </div>
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-white">
                          {subscription.status === 'cancelled' ? 'Access Until' : 'Next Billing'}
                        </div>
                        <div className="text-sm text-zinc-500">
                          {formatDate(subscription.current_period_end)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pro Features */}
                {isPro && (
                  <div className="py-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="font-medium text-zinc-900 dark:text-white">Pro Features</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-13">
                      {['Unlimited Interviews', 'Interview Recordings', 'Progress Analytics', 'Priority Support'].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manage Subscription */}
                <div className="pt-2">
                  <Button 
                    variant="secondary" 
                    fullWidth
                    onClick={() => navigate('/pricing')}
                    rightIcon={<ExternalLink className="w-4 h-4" />}
                  >
                    {isPro ? 'Manage Subscription' : 'Upgrade Plan'}
                  </Button>
                </div>
              </div>
            ) : (
              /* Free User */
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Free Plan</h3>
                <p className="text-sm text-zinc-500 mb-4">
                  You're on the free plan with limited features.
                </p>
                <Button 
                  onClick={() => navigate('/pricing')}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div className="glass-card p-6 fade-in-up bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
              Account
            </h2>
            
            <div className="space-y-3">
              <Link 
                to="/settings"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
              >
                <span className="text-zinc-700 dark:text-zinc-300">Settings</span>
                <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
              </Link>
              
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-red-600 dark:text-red-400 group"
              >
                <span>Sign Out</span>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
