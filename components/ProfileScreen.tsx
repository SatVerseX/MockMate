import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';
import { useBilling } from '../hooks/useBilling';
import { Navbar } from './Navbar';
import {
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
  Loader2,
  Sparkles,
  ChevronRight
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
      default: return 'Free Plan';
    }
  };

  const getPlanBadgeColor = () => {
    if (isPro) return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/20';
    if (planTier === 'starter') return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20';
    if (planTier === 'one_day') return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20';
    return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400';
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return null;
    switch (subscription.status) {
      case 'active': return { label: 'Active', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 };
      case 'cancelled': return { label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertCircle };
      case 'expired': return { label: 'Expired', color: 'text-zinc-500', bg: 'bg-zinc-500/10', icon: AlertCircle };
      default: return { label: subscription.status, color: 'text-zinc-500', bg: 'bg-zinc-100 dark:bg-zinc-800', icon: Clock };
    }
  };

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300 font-sans selection:bg-emerald-500/30">
      <Navbar onStart={() => navigate('/setup')} />

      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 py-24 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 fade-in-up">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-200">Profile</span>
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-lg">
              Manage your account settings, subscription, and billing details here.
            </p>
          </div>
          <div className="flex gap-3">
             <Button
                variant="ghost" 
                onClick={handleSignOut}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Sign Out
              </Button>
          </div>
        </div>

        {/* User Info Card */}
        <div className="glass-card p-8 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm rounded-3xl fade-in-up hover:shadow-lg transition-all duration-500 group relative overflow-hidden" style={{ animationDelay: '0.1s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center text-4xl font-bold text-zinc-400 shadow-inner">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    profile?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-black p-1.5 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                   <div className={`w-3 h-3 rounded-full ${isPro ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 space-y-4 w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1 flex items-center gap-3">
                      {profile?.fullName || 'User'}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getPlanBadgeColor()}`}>
                        {getPlanDisplayName()}
                      </span>
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4" />
                        {user?.email || 'No email'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Joined {formatDate(user?.created_at)}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/settings')}
                    size="sm"
                    className="border-zinc-200 dark:border-zinc-800"
                  >
                    Edit Settings
                  </Button>
                </div>
                
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-100 dark:border-white/5">
                   <div className="text-center md:text-left">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold mb-1">Status</div>
                      <div className="font-medium text-zinc-900 dark:text-white flex items-center gap-2 justify-center md:justify-start">
                         {isPro ? <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> : <Shield className="w-4 h-4 text-zinc-400" />}
                         {isPro ? 'Pro Member' : 'Free Tier'}
                      </div>
                   </div>
                   <div className="text-center md:text-left">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold mb-1">Current Plan</div>
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {getPlanDisplayName()}
                      </div>
                   </div>
                </div>
              </div>
            </div>
        </div>

        {/* Subscription & Billing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 fade-in-up" style={{ animationDelay: '0.2s' }}>
           {/* Card 1: Plan Details */}
           <div className="md:col-span-2 glass-card bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                  Subscription Details
                </h3>
                {loading && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
              </div>

              {subscription ? (
                <div className="space-y-6">
                  <div className="bg-zinc-50 dark:bg-white/5 rounded-xl p-5 border border-zinc-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                         <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Current Plan</div>
                         <div className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            {getPlanDisplayName()}
                            {subscriptionStatus && (
                              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${subscriptionStatus.bg} ${subscriptionStatus.color}`}>
                                <subscriptionStatus.icon className="w-3 h-3" />
                                {subscriptionStatus.label}
                              </span>
                            )}
                         </div>
                      </div>
                      <Crown className={`w-8 h-8 ${isPro ? 'text-amber-500' : 'text-zinc-300'}`} />
                    </div>
                    {subscription.current_period_end && (
                      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                         <Clock className="w-4 h-4" />
                         {subscription.status === 'cancelled' ? 'Access ends on' : 'Renews on'} {formatDate(subscription.current_period_end)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                     <Button 
                        fullWidth 
                        onClick={() => navigate('/pricing')} 
                        glow={!isPro}
                        variant={isPro ? "outline" : "primary"}
                     >
                        {isPro ? 'Change Plan' : 'Upgrade to Pro'}
                     </Button>
                     {isPro && (
                       <Button variant="ghost" className="text-zinc-500">
                          Manage Billing
                       </Button>
                     )}
                  </div>
                </div>
              ) : (
                 <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                       <Shield className="w-8 h-8 text-zinc-400" />
                    </div>
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-2">Free Plan Active</h4>
                    <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
                       You are currently on the limited free plan. Upgrade to unlock unlimited interviews and detailed insights.
                    </p>
                    <Button onClick={() => navigate('/pricing')} glow fullWidth>
                       <Zap className="w-4 h-4 mr-2" />
                       Upgrade Now
                    </Button>
                 </div>
              )}
           </div>

           {/* Card 2: Features Included */}
           <div className="glass-card bg-gradient-to-br from-emerald-900/10 to-teal-900/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Included Features
                 </h3>
                 <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                       <CheckCircle2 className={`w-4 h-4 ${isPro ? 'text-emerald-500' : 'text-zinc-400'}`} />
                       {isPro ? 'Unlimited Interviews' : '1 Interview per day'}
                    </li>
                    <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                       <CheckCircle2 className={`w-4 h-4 ${isPro ? 'text-emerald-500' : 'text-zinc-400'}`} />
                       {isPro ? 'Advanced AI Feedback' : 'Basic Feedback'}
                    </li>
                    <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                       <CheckCircle2 className={`w-4 h-4 ${isPro ? 'text-emerald-500' : 'text-zinc-400'}`} />
                       {isPro ? 'Interview Recordings' : 'No Recordings'}
                    </li>
                    <li className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                       <CheckCircle2 className={`w-4 h-4 ${isPro ? 'text-emerald-500' : 'text-zinc-400'}`} />
                       {isPro ? 'Priority Support' : 'Standard Support'}
                    </li>
                 </ul>
              </div>
              {!isPro && (
                 <div className="mt-6 pt-6 border-t border-emerald-500/20">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-3">
                       ✨ Unlock full potential today
                    </p>
                    <div className="h-1.5 w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-1/3" />
                    </div>
                 </div>
              )}
           </div>
        </div>
      </main>
    </div>
  );
};
