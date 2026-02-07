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
        const signature = req.headers.get('x-razorpay-signature')
        const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
        const body = await req.text()

        if (!signature || !secret) {
            throw new Error('Missing signature or secret')
        }

        // Validate Signature
        const isValid = Razorpay.validateWebhookSignature(body, signature, secret)
        if (!isValid) {
            throw new Error('Invalid signature')
        }

        const event = JSON.parse(body)
        const { payload } = event
        const subscription = payload.subscription ? payload.subscription.entity : null

        if (subscription) {
            const supabaseClient = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use Service Role Key for Webhook updates
            )

            const status = subscription.status // 'active', 'halted', etc.
            const currentPeriodEnd = new Date(subscription.current_end * 1000)

            // Find user by razorpay_customer_id or subscription_id
            // We stored razorpay_customer_id in our DB.

            await supabaseClient
                .from('subscriptions')
                .update({
                    status: status,
                    current_period_end: currentPeriodEnd,
                    razorpay_subscription_id: subscription.id,
                    plan_id: subscription.plan_id
                })
                .eq('razorpay_customer_id', subscription.customer_id)
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error(error)
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
