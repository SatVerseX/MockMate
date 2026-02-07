
import { createClient } from 'npm:@supabase/supabase-js@2'
import Razorpay from 'npm:razorpay@2.9.4'

const razorpay = new Razorpay({
    key_id: Deno.env.get('RAZORPAY_KEY_ID') ?? '',
    key_secret: Deno.env.get('RAZORPAY_KEY_SECRET') ?? '',
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
        console.log('Starting create-subscription function')

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            console.log('User not authenticated')
            throw new Error('Not authenticated')
        }
        console.log('User authenticated:', user.id)

        const { planId } = await req.json()
        if (!planId) throw new Error('planId is required')
        console.log('Plan ID received:', planId)

        // 1. Get Plan Details
        const { data: plan, error: planError } = await supabaseClient
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single()

        if (planError) {
            console.log('Plan error:', planError)
            throw new Error(`Invalid Plan ID: ${planError.message}`)
        }
        if (!plan) throw new Error('Plan not found')
        console.log('Plan found:', plan.name, 'Type:', plan.type)

        // 2. Get/Create User's Subscription Record (for customer ID)
        let { data: subscription, error: subError } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle() // Use maybeSingle instead of single to avoid error when no subscription exists

        if (subError) {
            console.log('Subscription fetch error:', subError)
        }
        console.log('Existing subscription:', subscription?.razorpay_customer_id || 'none')

        let razorpayCustomerId = subscription?.razorpay_customer_id

        // 3. Create Razorpay Customer if needed
        if (!razorpayCustomerId) {
            console.log('Creating new Razorpay customer...')
            try {
                const customer = await razorpay.customers.create({
                    email: user.email,
                    name: user.user_metadata?.full_name || 'User',
                    notes: { supabase_user_id: user.id }
                })
                razorpayCustomerId = customer.id
                console.log('Created Razorpay customer:', razorpayCustomerId)

                // Upsert into DB
                const { error: upsertError } = await supabaseClient.from('subscriptions').upsert({
                    user_id: user.id,
                    razorpay_customer_id: razorpayCustomerId,
                    status: 'created'
                })
                if (upsertError) {
                    console.log('Upsert error:', upsertError)
                    throw new Error(`Failed to save customer: ${upsertError.message}`)
                }
            } catch (customerError: any) {
                console.log('Customer creation error:', customerError)
                throw new Error(`Failed to create customer: ${customerError.message || customerError}`)
            }
        }

        // 4. Branch Logic: One-Time vs Recurring
        if (plan.type === 'one_time') {
            console.log('Creating one-time order...')
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
            console.log('Order created:', order.id)

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
            console.log('Creating recurring subscription...')
            // Create Subscription
            const sub = await razorpay.subscriptions.create({
                plan_id: planId,
                customer_id: razorpayCustomerId,
                total_count: 120,
                quantity: 1,
                notes: {
                    supabase_user_id: user.id
                }
            })
            console.log('Subscription created:', sub.id)

            // Update DB
            const { error: updateError } = await supabaseClient
                .from('subscriptions')
                .update({ razorpay_subscription_id: sub.id, plan_id: planId })
                .eq('user_id', user.id)

            if (updateError) {
                console.log('Update error:', updateError)
            }

            return new Response(
                JSON.stringify({
                    subscriptionId: sub.id,
                    keyId: Deno.env.get('RAZORPAY_KEY_ID'),
                    type: 'recurring'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

    } catch (error: any) {
        console.log('Error in create-subscription:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Unknown error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
