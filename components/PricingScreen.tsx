import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBilling } from '../hooks/useBilling';
import { Button } from './Button';
import { Plan } from '../types';

export const PricingScreen: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { subscribeToPlan, loading: processing, subscription, isPro } = useBilling();

  useEffect(() => {
    async function loadPlans() {
      try {
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .order('price', { ascending: true });
        
        if (error) throw error;
        
        // Deduplicate plans by name (keep first occurrence)
        const uniquePlans = (data as Plan[]).filter(
          (plan, index, self) => self.findIndex(p => p.name === plan.name) === index
        );
        setPlans(uniquePlans);
      } catch (err) {
        console.error("Failed to load plans", err);
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-20 px-6 relative overflow-hidden transition-colors duration-500">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-sm font-semibold text-emerald-500 tracking-wider uppercase">Upgrade your career</h2>
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Simple, Transparent <span className="text-emerald-500">Pricing</span>
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
            Choose the perfect plan to unlock unlimited AI interviews, detailed feedback analysis, and career-accelerating features.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          
          {/* Free Plan */}
          <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl p-8 shadow-xl transition-transform hover:-translate-y-2 relative group flex flex-col">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Free Starter</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-zinc-900 dark:text-white">₹0</span>
              <span className="text-zinc-500 dark:text-zinc-400">/month</span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
              Perfect for getting started and trying out the AI interviewer.
            </p>
            
            <div className="space-y-4 mb-8">
              {['1 Interview per day', 'Basic Feedback', 'Standard Support'].map((feat, i) => (
                <div key={i} className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-sm">{feat}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto">
              <Button variant="secondary" fullWidth disabled>
                {isPro ? "Included" : "Current Plan"}
              </Button>
            </div>
          </div>

          {/* Paid Plans from DB - filter out any free/starter plans to avoid duplication */}
          {plans
            .filter((plan) => plan.price > 0) // Only show paid plans, free is hardcoded above
            .map((plan) => {
            const isCurrentPlan = subscription?.plan_id === plan.id;
            
            // Feature mapping based on plan type
            const planName = plan.name?.toLowerCase() || '';
            const getFeatures = (): string[] => {
              if (planName.includes('one day') || planName.includes('daily')) {
                return [
                  '24-Hour Unlimited Access',
                  'Detailed Analysis',
                  'PDF Reports',
                  'No Subscription Needed'
                ];
              }
              if (planName.includes('pro') && plan.interval === 'yearly') {
                return [
                  'Everything in Monthly',
                  '2 Months Free',
                  'Interview Recordings',
                  'Progress Analytics',
                  'Priority Support'
                ];
              }
              if (planName.includes('pro')) {
                return [
                  'Unlimited AI Interviews',
                  'Interview Recordings',
                  'Progress Analytics',
                  'Detailed Analysis & PDF',
                  'Priority Support'
                ];
              }
              // Starter plan
              return [
                'Unlimited AI Interviews',
                'Detailed Analysis',
                'PDF Reports',
                '30-Day History',
                'Standard Support'
              ];
            };
            const displayFeatures = getFeatures();

            return (
              <div 
                key={plan.id}
                className={`
                   relative bg-white dark:bg-zinc-900/80 backdrop-blur-xl border-2 rounded-3xl p-8 shadow-2xl transition-all hover:shadow-emerald-500/20 hover:-translate-y-2 flex flex-col
                   ${isCurrentPlan ? 'border-emerald-500' : 'border-zinc-200 dark:border-zinc-800'}
                `}
              >
                {/* Popular Badge */}
                {plan.interval === 'yearly' && (
                   <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                      <Sparkles size={12} />
                      BEST VALUE
                   </div>
                )}

                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{plan.name}</h3>
                 <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-zinc-900 dark:text-white">
                    ₹{plan.price / 100}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400">/{plan.interval}</span>
                </div>
                 <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
                  Unlock your full potential with unlimited access.
                </p>

                <div className="space-y-4 mb-8">
                  {displayFeatures.map((feat, i) => (
                    <div key={i} className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                      <div className="p-1 rounded-full bg-emerald-500/10">
                        <Zap className="w-3 h-3 text-emerald-500" />
                      </div>
                      <span className="text-sm font-medium">{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto">
                  <Button 
                    onClick={() => !isCurrentPlan && subscribeToPlan(plan.id)}
                    variant={isCurrentPlan ?  "secondary" : "primary"}
                    fullWidth
                    disabled={processing || isCurrentPlan}
                    className={!isCurrentPlan ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25" : ""}
                  >
                    {processing ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                        </span>
                    ) : isCurrentPlan ? (
                        <span className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Active
                        </span>
                    ) : (
                        "Upgrade to Pro"
                    )}
                  </Button>
                </div>
              </div>
            );
          })} 
        </div>

        {/* Trust Badge */}
        <div className="mt-16 text-center">
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-4">Secured by</p>
            <div className="flex items-center justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
               {/* Just text implementation for simplicity */}
               <h3 className="text-xl font-bold text-blue-600">Razorpay</h3>
            </div>
        </div>
      </div>
    </div>
  );
};
