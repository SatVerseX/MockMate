# Razorpay Integration Guide (हिंदी में)

यह guide आपको step-by-step बताएगी कि कैसे अपने Next.js/React app में Razorpay payment integration करें।

---

## 📋 Prerequisites (पूर्व आवश्यकताएं)

1. **Razorpay Account** - [dashboard.razorpay.com](https://dashboard.razorpay.com) पर signup करें
2. **Supabase Project** - Backend के लिए
3. **API Keys** - Razorpay Dashboard से `key_id` और `key_secret` प्राप्त करें

---

## 🚀 Step 1: Razorpay Account Setup

### 1.1 Account बनाएं
1. [dashboard.razorpay.com](https://dashboard.razorpay.com) पर जाएं
2. Sign up करें या login करें
3. KYC documents submit करें (live payments के लिए)

### 1.2 API Keys प्राप्त करें
1. Dashboard → **Settings** → **API Keys** पर जाएं
2. **Generate Key** पर click करें
3. **Key ID** और **Key Secret** को सुरक्षित save करें

> ⚠️ **Important**: Key Secret सिर्फ एक बार दिखाया जाता है। इसे तुरंत copy करें!

### 1.3 Test Mode vs Live Mode
- **Test Mode**: Development के लिए (`rzp_test_` से शुरू)
- **Live Mode**: Production के लिए (`rzp_live_` से शुरू)

---

## 🔧 Step 2: Supabase Edge Function Setup

### 2.1 Supabase CLI Install करें
```bash
npm install -g supabase
```

### 2.2 Supabase Project से Link करें
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 2.3 Secrets Set करें
```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxx
supabase secrets set RAZORPAY_KEY_SECRET=your_secret_key
```

---

## 📁 Step 3: Edge Function बनाएं

### 3.1 Function Create करें
```bash
supabase functions new create-subscription
```

### 3.2 Function Code (`supabase/functions/create-subscription/index.ts`)

```typescript
import { createClient } from 'npm:@supabase/supabase-js@2'
import Razorpay from 'npm:razorpay@2.9.4'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // CORS preflight handle करें
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Razorpay client initialize करें
        const razorpay = new Razorpay({
            key_id: Deno.env.get('RAZORPAY_KEY_ID'),
            key_secret: Deno.env.get('RAZORPAY_KEY_SECRET'),
        })

        // Request से planId लें
        const { planId, amount } = await req.json()

        // One-time payment के लिए Order create करें
        const order = await razorpay.orders.create({
            amount: amount, // Amount पैसों में (₹100 = 10000 paise)
            currency: 'INR',
            receipt: `order_${Date.now()}`,
        })

        return new Response(
            JSON.stringify({
                orderId: order.id,
                amount: amount,
                currency: 'INR',
                keyId: Deno.env.get('RAZORPAY_KEY_ID'),
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
```

### 3.3 Function Deploy करें
```bash
supabase functions deploy create-subscription --no-verify-jwt
```

---

## 💻 Step 4: Frontend Integration

### 4.1 Razorpay Script Load करें

```typescript
// hooks/useRazorpay.ts
export const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if (document.getElementById('razorpay-script')) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};
```

### 4.2 Payment Function बनाएं

```typescript
// hooks/useBilling.ts
import { supabase } from '../lib/supabase';

export function useBilling() {
    const initiatePayment = async (planId: string, amount: number) => {
        // 1. Razorpay script load करें
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) throw new Error('Razorpay SDK load नहीं हुआ');

        // 2. Backend से order create करें
        const { data, error } = await supabase.functions.invoke('create-subscription', {
            body: { planId, amount }
        });

        if (error) throw error;

        // 3. Razorpay checkout open करें
        const options = {
            key: data.keyId,
            amount: data.amount,
            currency: data.currency,
            order_id: data.orderId,
            name: 'Your App Name',
            description: 'Payment for subscription',
            handler: function (response: any) {
                // Payment successful!
                console.log('Payment ID:', response.razorpay_payment_id);
                console.log('Order ID:', response.razorpay_order_id);
                console.log('Signature:', response.razorpay_signature);
                // Verify payment on backend
            },
            prefill: {
                email: 'user@example.com',
            },
            theme: {
                color: '#10B981'
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    return { initiatePayment };
}
```

### 4.3 Payment Button Component

```tsx
// components/PaymentButton.tsx
import { useBilling } from '../hooks/useBilling';

export function PaymentButton({ planId, amount, label }) {
    const { initiatePayment } = useBilling();
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        try {
            await initiatePayment(planId, amount);
        } catch (error) {
            alert('Payment failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button onClick={handleClick} disabled={loading}>
            {loading ? 'Processing...' : label}
        </button>
    );
}
```

---

## ✅ Step 5: Payment Verification (Webhook)

### 5.1 Webhook Function बनाएं

```typescript
// supabase/functions/razorpay-webhook/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2'
import { createHmac } from 'node:crypto'

Deno.serve(async (req) => {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    
    // Signature verify करें
    const expectedSignature = createHmac('sha256', Deno.env.get('RAZORPAY_KEY_SECRET'))
        .update(body)
        .digest('hex');
    
    if (signature !== expectedSignature) {
        return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);
    
    // Payment captured event handle करें
    if (event.event === 'payment.captured') {
        const payment = event.payload.payment.entity;
        // Database में status update करें
        console.log('Payment captured:', payment.id);
    }

    return new Response('OK');
});
```

### 5.2 Razorpay Dashboard में Webhook Setup करें
1. Dashboard → **Settings** → **Webhooks** पर जाएं
2. **Add New Webhook** पर click करें
3. URL डालें: `https://YOUR_PROJECT.supabase.co/functions/v1/razorpay-webhook`
4. Events select करें: `payment.captured`, `payment.failed`
5. Secret generate करें और save करें

---

## 🧪 Step 6: Testing

### Test Card Details
| Field | Value |
|-------|-------|
| Card Number | `4111 1111 1111 1111` |
| Expiry | Any future date |
| CVV | Any 3 digits |
| OTP | `1234` |

### Test UPI
- UPI ID: `success@razorpay`

---

## 📊 Database Schema

### Plans Table
```sql
CREATE TABLE plans (
    id TEXT PRIMARY KEY, -- Razorpay Plan ID
    name TEXT NOT NULL,
    price INTEGER NOT NULL, -- पैसों में
    interval TEXT, -- 'monthly', 'yearly', 'daily'
    type TEXT DEFAULT 'recurring', -- 'recurring' या 'one_time'
    features JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    plan_id TEXT REFERENCES plans(id),
    razorpay_subscription_id TEXT,
    razorpay_customer_id TEXT,
    status TEXT DEFAULT 'created',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔒 Security Tips

1. **Never expose `key_secret`** - Frontend में सिर्फ `key_id` use करें
2. **Always verify signature** - Webhook में signature verification जरूर करें
3. **Use environment variables** - Credentials को `.env` में रखें
4. **Enable HTTPS** - Production में SSL certificate जरूर होना चाहिए

---

## 🐛 Common Errors & Solutions

| Error | Solution |
|-------|----------|
| `SERVER_ERROR` | Razorpay credentials check करें |
| `401 Unauthorized` | Edge function में `--no-verify-jwt` use करें |
| `CORS Error` | `corsHeaders` properly set करें |
| `Customer creation failed` | One-time payments के लिए customer की जरूरत नहीं |

---

## 📚 Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Test Cards](https://razorpay.com/docs/payments/payments/test-card-upi-details/)

---

**Made with ❤️ for MockMate AI**
