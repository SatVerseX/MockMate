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
        const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';
        if (!RAZORPAY_KEY_SECRET) throw new Error("Missing Razorpay Secret");

        // Client for Auth (identifying user)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Admin for DB Updates (bypassing RLS)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const {
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_order_id,
            razorpay_signature
        } = await req.json()

        if (!razorpay_payment_id || !razorpay_signature) {
            throw new Error('Missing required payment details')
        }

        let isValid = false;

        // Verify Subscription
        if (razorpay_subscription_id) {
            const generated_signature = Razorpay.validateWebhookSignature(
                razorpay_payment_id + '|' + razorpay_subscription_id,
                razorpay_signature,
                RAZORPAY_KEY_SECRET
            )
            isValid = !!generated_signature;

            if (isValid) {
                await supabaseAdmin
                    .from('subscriptions')
                    .update({
                        status: 'active',
                        razorpay_subscription_id: razorpay_subscription_id
                    })
                    .eq('razorpay_subscription_id', razorpay_subscription_id)
            }
        }
        // Verify One-Time Order
        else if (razorpay_order_id) {
            const text = razorpay_order_id + "|" + razorpay_payment_id;
            const generated_signature = Razorpay.validateWebhookSignature(
                text,
                razorpay_signature,
                RAZORPAY_KEY_SECRET
            )
            isValid = !!generated_signature;

            if (isValid) {
                // Get the user_id that owns this subscription/order
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (!user) throw new Error("User not found for update");

                // Calculate Expiry for Day Pass (24 hours)
                const expiry = new Date();
                expiry.setHours(expiry.getHours() + 24);

                await supabaseAdmin
                    .from('subscriptions')
                    .upsert({
                        user_id: user.id,
                        status: 'active',
                        current_period_end: expiry.toISOString(),
                        plan_id: 'plan_day_pass_20'
                    })
            }
        }

        if (!isValid) {
            throw new Error('Invalid signature')
        }

        return new Response(
            JSON.stringify({ success: true, message: "Payment verified and activated." }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
