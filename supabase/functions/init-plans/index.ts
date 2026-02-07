import { createClient } from '@supabase/supabase-js'
// @deno-types="@types/razorpay"
import Razorpay from 'razorpay'

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
                db_features: ["Unlimited AI Interviews", "Priority Support", "Detailed Analysis", "Valid for 1 Month"]
            },
            {
                name: 'One Day Pass',
                amount: 2000, // 20 INR
                currency: 'INR',
                period: 'daily',
                interval: 1,
                description: '24-Hour Unlimited Access',
                db_features: ["24-Hour Unlimited Access", "Instant Feedback", "No Subscription Commitment", "PDF Reports"]
            }
        ]

        const results = [];

        for (const plan of plansToCreate) {
            console.log(`Processing plan: ${plan.name}`);
            try {
                // 1. Create Plan on Razorpay
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

                console.log(`Created Razorpay Plan ID: ${rzpPlan.id}`);

                // 2. Upsert into Supabase
                const { error } = await supabaseClient
                    .from('plans')
                    .upsert({
                        id: rzpPlan.id,
                        name: plan.name,
                        price: plan.amount,
                        interval: plan.period,
                        features: plan.db_features
                    });

                if (error) throw error;

                results.push({ name: plan.name, status: 'success', id: rzpPlan.id });
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
