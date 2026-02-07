
import { createClient } from '@supabase/supabase-js'
// @deno-types="https://esm.sh/@types/razorpay@2.4.1"
import Razorpay from 'razorpay'

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.error("Missing Razorpay Keys");
}

const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
})

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) throw new Error('Not authenticated')

        const { planId } = await req.json()
        if (!planId) throw new Error('planId is required')

        // 1. Get Plan Details
        const { data: plan, error: planError } = await supabaseClient
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single()

        if (planError || !plan) throw new Error('Invalid Plan ID')

        // 2. Get/Create User's Subscription Record (for customer ID)
        let { data: subscription } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single()

        let razorpayCustomerId = subscription?.razorpay_customer_id

        // 3. Create Razorpay Customer if needed
        if (!razorpayCustomerId) {
            const customer = await razorpay.customers.create({
                email: user.email,
                name: user.user_metadata.full_name || 'User',
                notes: { supabase_user_id: user.id }
            })
            razorpayCustomerId = customer.id

            // Upsert into DB
            await supabaseClient.from('subscriptions').upsert({
                user_id: user.id,
                razorpay_customer_id: razorpayCustomerId,
                status: 'created'
            })
        }

        // 4. Branch Logic: One-Time vs Recurring
        if (plan.type === 'one_time') {
            // Create Razorpay Order
            const order = await razorpay.orders.create({
                amount: plan.price, // Amount in paise
                currency: 'INR',
                receipt: user.id.slice(0, 10), // Shorten ID for receipt
                notes: {
                    supabase_user_id: user.id,
                    plan_id: planId
                }
            })

            return new Response(
                JSON.stringify({
                    orderId: order.id,
                    amount: plan.price,
                    currency: 'INR',
                    keyId: Deno.env.get('RAZORPAY_KEY_ID'),
                    type: 'one_time'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        } else {
            // Create Subscription
            const sub = await razorpay.subscriptions.create({
                plan_id: planId,
                customer_id: razorpayCustomerId,
                total_count: 120,
                quantity: 1,
                addons: [],
                notes: {
                    supabase_user_id: user.id
                }
            })

            // Update DB
            await supabaseClient
                .from('subscriptions')
                .update({ razorpay_subscription_id: sub.id, plan_id: planId })
                .eq('user_id', user.id)

            return new Response(
                JSON.stringify({
                    subscriptionId: sub.id,
                    keyId: Deno.env.get('RAZORPAY_KEY_ID'),
                    type: 'recurring'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

    } catch (error) {
        console.error("Create Subscription Error:", error);
        return new Response(
            JSON.stringify({
                error: (error as Error).message,
                details: error
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
