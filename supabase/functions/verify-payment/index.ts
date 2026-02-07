import { createClient } from 'npm:@supabase/supabase-js@2'
import { createHmac } from 'node:crypto'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    console.log('Verify-payment function invoked')

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create Supabase client with user's auth token
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Also create admin client for bypassing RLS if needed
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

        console.log('Payment verification request:', {
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            subscription_id: razorpay_subscription_id
        })

        if (!razorpay_payment_id || !razorpay_signature) {
            throw new Error('Missing required payment details')
        }

        // Get user from auth token
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        console.log('User from token:', user?.id, 'Error:', userError)

        if (!user) {
            throw new Error('User not authenticated')
        }

        const secret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? ''
        let isValid = false

        // Verify signature based on payment type
        if (razorpay_subscription_id) {
            // Subscription signature: payment_id|subscription_id
            const text = razorpay_payment_id + '|' + razorpay_subscription_id
            const expectedSignature = createHmac('sha256', secret).update(text).digest('hex')
            isValid = expectedSignature === razorpay_signature
            console.log('Subscription signature validation:', isValid)

            if (isValid) {
                const { error: updateError } = await supabaseAdmin
                    .from('subscriptions')
                    .update({
                        status: 'active',
                        razorpay_subscription_id: razorpay_subscription_id
                    })
                    .eq('user_id', user.id)

                if (updateError) {
                    console.log('Update error:', updateError)
                }
            }
        } else if (razorpay_order_id) {
            // Order signature: order_id|payment_id
            const text = razorpay_order_id + '|' + razorpay_payment_id
            const expectedSignature = createHmac('sha256', secret).update(text).digest('hex')
            isValid = expectedSignature === razorpay_signature
            console.log('Order signature validation:', isValid)

            if (isValid) {
                // Calculate Expiry for Day Pass (24 hours)
                const expiry = new Date()
                expiry.setHours(expiry.getHours() + 24)

                const { error: upsertError } = await supabaseAdmin
                    .from('subscriptions')
                    .upsert({
                        user_id: user.id,
                        status: 'active',
                        current_period_end: expiry.toISOString(),
                        plan_id: 'plan_oneday_1770475519459' // Day pass plan
                    }, { onConflict: 'user_id' })

                if (upsertError) {
                    console.log('Upsert error:', upsertError)
                    throw new Error(`Failed to update subscription: ${upsertError.message}`)
                }
                console.log('Day pass activated until:', expiry.toISOString())
            }
        }

        if (!isValid) {
            console.log('Signature validation failed')
            throw new Error('Invalid payment signature')
        }

        console.log('Payment verified successfully!')
        return new Response(
            JSON.stringify({ success: true, message: "Payment verified and activated." }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.log('Verification error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Unknown error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
