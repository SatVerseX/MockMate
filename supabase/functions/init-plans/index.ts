import { createClient } from 'npm:@supabase/supabase-js@2'
import Razorpay from 'npm:razorpay@2.9.4'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const razorpay = new Razorpay({
            key_id: Deno.env.get('RAZORPAY_KEY_ID') ?? '',
            key_secret: Deno.env.get('RAZORPAY_KEY_SECRET') ?? '',
        })

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Define the plans we want
        const plansToCreate = [
            {
                name: 'Starter Monthly',
                amount: 19900, // 199 INR in paise
                currency: 'INR',
                period: 'monthly',
                interval: 1,
                description: 'Unlimited AI Interviews, Priority Support',
                type: 'recurring', // Subscription plan
                db_features: ["Unlimited AI Interviews", "AI Voice Interviewer", "Voice-Based Responses", "Audio Recording", "Priority Support", "Detailed Analysis", "Valid for 1 Month"]
            },
            {
                name: 'One Day Pass',
                amount: 2000, // 20 INR
                currency: 'INR',
                period: 'daily',
                interval: 1,
                description: '24-Hour Unlimited Access',
                type: 'one_time', // One-time payment, not a subscription
                db_features: ["24-Hour Unlimited Access", "Instant Feedback", "No Subscription Commitment", "PDF Reports"]
            }
        ]

        const results = [];

        for (const plan of plansToCreate) {
            console.log(`Processing plan: ${plan.name}`);
            try {
                let rzpPlanId: string;

                // For one-time payments, we don't create a Razorpay Plan (we create Orders instead)
                // So we generate a local ID for one-time plans
                if (plan.type === 'one_time') {
                    rzpPlanId = `plan_oneday_${Date.now()}`;
                    console.log(`Generated local ID for one-time plan: ${rzpPlanId}`);
                } else {
                    // Create Plan on Razorpay for recurring subscriptions
                    const rzpPlan = await razorpay.plans.create({
                        period: plan.period,
                        interval: plan.interval,
                        item: {
                            name: plan.name,
                            amount: plan.amount,
                            currency: plan.currency,
                            description: plan.description
                        }
                    });
                    rzpPlanId = rzpPlan.id;
                    console.log(`Created Razorpay Plan ID: ${rzpPlanId}`);
                }

                // Upsert into Supabase
                const { error } = await supabaseClient
                    .from('plans')
                    .upsert({
                        id: rzpPlanId,
                        name: plan.name,
                        price: plan.amount,
                        interval: plan.period,
                        features: plan.db_features,
                        type: plan.type // Include the type for proper flow handling
                    });

                if (error) throw error;

                results.push({ name: plan.name, status: 'success', id: rzpPlanId });
            } catch (err) {
                console.error(`Failed to create plan ${plan.name}:`, err);
                results.push({ name: plan.name, status: 'failed', error: (err as Error).message });
            }
        }

        return new Response(
            JSON.stringify({ results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
