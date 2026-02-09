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

        // Get the user from the Authorization header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Authorization header missing')
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

        if (authError || !user) {
            throw new Error('Invalid authentication')
        }

        // Get user's subscription from database
        const { data: subscription, error: subError } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (subError || !subscription) {
            throw new Error('No active subscription found')
        }

        const razorpaySubId = subscription.razorpay_subscription_id

        if (!razorpaySubId) {
            // For one-time payments (One Day Pass), just update status
            const { error: updateError } = await supabaseClient
                .from('subscriptions')
                .update({ status: 'cancelled' })
                .eq('user_id', user.id)

            if (updateError) throw updateError

            return new Response(
                JSON.stringify({ success: true, message: 'Subscription cancelled' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Cancel on Razorpay (at end of current period)
        const cancelledSub = await razorpay.subscriptions.cancel(razorpaySubId, false)

        // Update local database
        const { error: updateError } = await supabaseClient
            .from('subscriptions')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString()
            })
            .eq('user_id', user.id)

        if (updateError) throw updateError

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Subscription cancelled successfully',
                endsAt: cancelledSub.current_end ? new Date(cancelledSub.current_end * 1000).toISOString() : subscription.current_period_end
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Cancel subscription error:', error)
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
