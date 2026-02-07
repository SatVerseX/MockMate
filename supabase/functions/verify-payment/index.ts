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
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use Service Role Key to bypass RLS if needed
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
                Deno.env.get('RAZORPAY_KEY_SECRET') ?? ''
            )
            isValid = !!generated_signature;

            if (isValid) {
                await supabaseClient
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
            // Signature for Orders: hmac_sha256(order_id + "|" + payment_id, secret)
            // Using Razorpay's utility if available, or manual check. 
            // Note: Razorpay wrapper might not have order signature util exposed same way.
            // Standard verification:
            const text = razorpay_order_id + "|" + razorpay_payment_id;
            // Using simple validation function/logic provided by Razorpay lib or manually
            const generated_signature = Razorpay.validateWebhookSignature(
                text,
                razorpay_signature,
                Deno.env.get('RAZORPAY_KEY_SECRET') ?? ''
            )
            isValid = !!generated_signature;

            if (isValid) {
                // Get the user_id that owns this subscription/order
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (!user) throw new Error("User not found for update");

                // Calculate Expiry for Day Pass (24 hours)
                // FUTURE: We should fetch plan details to determine duration dynamically.
                // For now, hardcoding 24 hours as this is specific for the Day Pass.
                const expiry = new Date();
                expiry.setHours(expiry.getHours() + 24);

                await supabaseClient
                    .from('subscriptions')
                    .upsert({
                        user_id: user.id,
                        status: 'active',
                        current_period_end: expiry.toISOString(),
                        // We might not have a subscription ID for one-time, but we need to link it
                        // Maybe we store order_id somewhere or just rely on user_id
                        plan_id: 'plan_day_pass_20' // Or fetch dynamically if stored in metadata
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
