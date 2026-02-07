import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Subscription, Plan, PlanTier, GatedFeature } from '../types';

interface RazorpayOptions {
    key: string;
    subscription_id: string;
    name: string;
    description: string;
    handler: (response: any) => void;
    theme: { color: string };
    prefill?: { email: string; contact?: string; name?: string };
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export function useBilling() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [subscription, setSubscription] = useState<Subscription | null>(null);

    // Fetch Subscription Status
    const fetchSubscription = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle(); // Use maybeSingle() to gracefully handle no subscription (free users)

        if (!error && data) {
            setSubscription(data as Subscription);
        } else {
            setSubscription(null); // Explicitly set to null if no subscription
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]); // Use user.id instead of user object

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    // Load Razorpay Script
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Create Subscription & Open Modal
    const subscribeToPlan = async (planId: string) => {
        if (!user) {
            alert("Please login to subscribe.");
            return;
        }

        setLoading(true);
        try {
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) throw new Error("Failed to load Razorpay SDK");

            // 1. Create Subscription on Backend
            const response = await supabase.functions.invoke('create-subscription', {
                body: { planId }
            });

            // Check for errors from the edge function
            if (response.error) {
                console.error("Edge function error:", response.error);
                throw new Error(response.error.message || "Edge function returned an error");
            }

            if (!response.data) throw new Error("Failed to initiate subscription - no data returned");

            // Check if the response contains an error from the edge function
            if (response.data.error) {
                throw new Error(response.data.error);
            }

            const { subscriptionId, orderId, keyId, amount, currency, type } = response.data;

            if (!keyId) throw new Error("Payment configuration missing");

            const options: any = {
                key: keyId,
                name: "MockMate AI",
                description: type === 'one_time' ? "One Day Pass" : "Pro Subscription",
                // Customize color if needed
                theme: {
                    color: "#10b981"
                },
                handler: async (response: any) => {
                    // response contains razorpay_payment_id, razorpay_subscription_id, razorpay_signature (for subs)
                    // OR razorpay_payment_id, razorpay_order_id, razorpay_signature (for orders)
                    await verifyPayment(response);
                },
                prefill: {
                    name: user.user_metadata.full_name,
                    email: user.email
                }
            };

            if (type === 'one_time') {
                options.amount = amount;
                options.currency = currency;
                options.order_id = orderId;
            } else {
                options.subscription_id = subscriptionId;
            }

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (err: any) {
            console.error("Subscription Error:", err);
            alert("Failed to start payment: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Verify Payment (Backend Call)
    const verifyPayment = async (paymentData: any) => {
        try {
            setLoading(true);
            const { error } = await supabase.functions.invoke('verify-payment', {
                body: paymentData
            });
            if (error) throw error;
            // Refresh Status
            await fetchSubscription();
            alert("Upgrade Successful! You are now Pro.");
        } catch (err) {
            console.error("Verification failed:", err);
            alert("Payment verification failed. Please contact support.");
        } finally {
            setLoading(false);
        }
    };

    // Cancel Subscription
    const cancelSubscription = async () => {
        // Implementation for cancellation if needed
        // Requires another backend function usually
        // For now, redirect to Razorpay portal or show contact support
        alert("To cancel, please contact support or manage via Razorpay portal.");
    };

    // Check Interview Limit
    const checkInterviewLimit = async (): Promise<{ allowed: boolean; remaining: number; total: number }> => {
        if (!user) return { allowed: false, remaining: 0, total: 0 };

        // 1. Get current usage for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error } = await supabase
            .from('results')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', today.toISOString()); // Assuming 'created_at' or 'start_time' exists. DB usually has created_at default.

        if (error) {
            console.error("Failed to check limits:", error);
            return { allowed: true, remaining: 1, total: 0 }; // Fail safe (allow)
        }

        const usage = count || 0;

        // 2. Determine Limit based on Plan
        // If Active Subscription -> Unlimited (e.g., 9999)
        // If Free -> 1 per day
        const isPro = subscription?.status === 'active';
        const limit = isPro ? 9999 : 1;

        return {
            allowed: usage < limit,
            remaining: Math.max(0, limit - usage),
            total: usage
        };
    };

    // Determine plan tier from subscription
    const planTier = useMemo((): PlanTier => {
        if (!subscription || subscription.status !== 'active') return 'free';

        const planId = subscription.plan_id?.toLowerCase() || '';
        const planName = (subscription as any).plan_name?.toLowerCase() || planId;

        // Check for one-day pass (usually has 'one_day' or 'daily' in id/name)
        if (planId.includes('one_day') || planId.includes('daily') || planName.includes('one day')) {
            return 'one_day';
        }
        // Check for yearly plans
        if (planId.includes('yearly') || planName.includes('yearly')) {
            return 'pro_yearly';
        }
        // Check for pro monthly (higher price tier)
        if (planId.includes('pro') || planName.includes('pro')) {
            return 'pro_monthly';
        }
        // Default paid plan is starter
        return 'starter';
    }, [subscription]);

    // Feature access matrix
    const FEATURE_ACCESS: Record<GatedFeature, PlanTier[]> = {
        unlimited_interviews: ['one_day', 'starter', 'pro_monthly', 'pro_yearly'],
        detailed_analysis: ['one_day', 'starter', 'pro_monthly', 'pro_yearly'],
        pdf_download: ['one_day', 'starter', 'pro_monthly', 'pro_yearly'],
        interview_history: ['starter', 'pro_monthly', 'pro_yearly'],
        audio_recording: ['pro_monthly', 'pro_yearly'],
        progress_analytics: ['pro_monthly', 'pro_yearly'],
    };

    // Check if user can access a specific feature
    const canAccessFeature = useCallback((feature: GatedFeature): boolean => {
        return FEATURE_ACCESS[feature]?.includes(planTier) || false;
    }, [planTier]);

    return {
        subscription,
        loading,
        subscribeToPlan,
        cancelSubscription,
        checkInterviewLimit,
        planTier,
        canAccessFeature,
        isPro: planTier !== 'free'
    };
}

