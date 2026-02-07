
import { createClient } from 'npm:@supabase/supabase-js@2'
import Razorpay from 'npm:razorpay@2.9.4'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    console.log('Function invoked - method:', req.method)

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log('Starting create-subscription function')

        // Initialize Razorpay inside handler to catch any init errors
        const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
        const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
        console.log('Razorpay Key ID present:', !!razorpayKeyId)
        console.log('Razorpay Key Secret present:', !!razorpayKeySecret)

        if (!razorpayKeyId || !razorpayKeySecret) {
            throw new Error('Razorpay credentials not configured')
        }

        const razorpay = new Razorpay({
            key_id: razorpayKeyId,
            key_secret: razorpayKeySecret,
        })

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

        // 4. Branch Logic: One-Time vs Recurring
        // For one-time payments, we don't need a customer - just create an order directly
        if (plan.type === 'one_time') {
            console.log('Creating one-time order (no customer needed)...')
            try {
                const order = await razorpay.orders.create({
                    amount: plan.price, // Amount in paise
                    currency: 'INR',
                    receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now()}`,
                    notes: {
                        supabase_user_id: user.id,
                        plan_id: planId,
                        user_email: user.email
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
            } catch (orderError: any) {
                console.log('Order creation error:', JSON.stringify(orderError, null, 2))
                const errorMessage = orderError?.error?.description || orderError?.message || JSON.stringify(orderError)
                throw new Error(`Failed to create order: ${errorMessage}`)
            }
        }

        // For recurring subscriptions, we need a customer
        console.log('Processing recurring subscription...')

        // 2. Get/Create User's Subscription Record (for customer ID)
        let { data: subscription, error: subError } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()

        if (subError) {
            console.log('Subscription fetch error:', subError)
        }
        console.log('Existing subscription:', subscription?.razorpay_customer_id || 'none')

        let razorpayCustomerId = subscription?.razorpay_customer_id

        // 3. Create Razorpay Customer if needed (only for recurring)
        if (!razorpayCustomerId) {
            console.log('Creating new Razorpay customer...')
            const customerEmail = user.email || `user_${user.id.slice(0, 8)}@mockmate.app`
            const customerName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
            const customerContact = user.user_metadata?.phone || user.phone || '9999999999' // Fallback contact

            console.log('Customer details:', { email: customerEmail, name: customerName, contact: customerContact })

            try {
                const customer = await razorpay.customers.create({
                    email: customerEmail,
                    name: customerName,
                    contact: customerContact,
                    fail_existing: '0', // Return existing customer if already exists
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
                console.log('Customer creation error details:', {
                    statusCode: customerError?.statusCode,
                    code: customerError?.error?.code,
                    description: customerError?.error?.description,
                    fullError: JSON.stringify(customerError, null, 2)
                })
                const errorMessage = customerError?.error?.description || customerError?.message || JSON.stringify(customerError)
                throw new Error(`Failed to create customer: ${errorMessage}`)
            }
        }

        // Create Subscription for recurring plans
        console.log('Creating recurring subscription...')
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

    } catch (error: any) {
        console.log('Error in create-subscription:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Unknown error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
