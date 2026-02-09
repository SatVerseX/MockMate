import { createClient } from 'npm:@supabase/supabase-js@2'
import Razorpay from 'npm:razorpay@2.9.4'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Razorpay
        const razorpay = new Razorpay({
            key_id: Deno.env.get('RAZORPAY_KEY_ID') ?? '',
            key_secret: Deno.env.get('RAZORPAY_KEY_SECRET') ?? '',
        })

        // Create Supabase client with anon key for user auth
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        // Get the Authorization header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Authorization header missing' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        // Create client with the user's token to verify auth
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: authHeader
                }
            }
        })

        // Get the authenticated user
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

        if (authError || !user) {
            console.error('Auth error:', authError)
            return new Response(
                JSON.stringify({ error: 'Invalid authentication' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        console.log('User authenticated:', user.id)

        // Create admin client for database operations
        const adminClient = createClient(supabaseUrl, supabaseServiceKey)

        // Get user's subscription from database
        const { data: subscription, error: subError } = await adminClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (subError || !subscription) {
            console.error('Subscription error:', subError)
            return new Response(
                JSON.stringify({ error: 'No active subscription found' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
            )
        }

        console.log('Found subscription:', subscription.id, 'status:', subscription.status)

        // Check if already cancelled
        if (subscription.status === 'cancelled') {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Subscription is already cancelled',
                    alreadyCancelled: true
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const razorpaySubId = subscription.razorpay_subscription_id

        if (!razorpaySubId) {
            // For one-time payments (One Day Pass), just update status
            const { error: updateError } = await adminClient
                .from('subscriptions')
                .update({ status: 'cancelled' })
                .eq('user_id', user.id)

            if (updateError) {
                console.error('Update error:', updateError)
                throw updateError
            }

            return new Response(
                JSON.stringify({ success: true, message: 'Subscription cancelled' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Try to cancel on Razorpay (at end of current period)
        console.log('Cancelling Razorpay subscription:', razorpaySubId)

        let cancelledOnRazorpay = false
        let razorpayError = null

        try {
            await razorpay.subscriptions.cancel(razorpaySubId, false)
            cancelledOnRazorpay = true
        } catch (error: any) {
            razorpayError = error
            console.log('Razorpay cancel error:', error.message || error)

            // Check if already cancelled on Razorpay
            if (error.error?.description?.includes('not cancellable') ||
                error.message?.includes('not cancellable') ||
                error.error?.description?.includes('already cancelled')) {
                console.log('Subscription already cancelled on Razorpay, updating database...')
                cancelledOnRazorpay = true
            } else {
                throw error
            }
        }

        // Update local database
        const { error: updateError } = await adminClient
            .from('subscriptions')
            .update({ status: 'cancelled' })
            .eq('user_id', user.id)

        if (updateError) {
            console.error('Database update error:', updateError)
            throw updateError
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Subscription cancelled successfully',
                endsAt: subscription.current_period_end
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Cancel subscription error:', error)
        return new Response(
            JSON.stringify({ error: (error as Error).message || 'Failed to cancel subscription' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
