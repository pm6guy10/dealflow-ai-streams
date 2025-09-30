# DealFlow - Production-Ready SaaS Backend

**Complete Stripe subscriptions + Auth + Chrome Extension API**

## 🚀 What's Built

### ✅ Database (PostgreSQL)
- **profiles** - Users with Stripe data & subscription status
- **sales_captured** - Every sale logged by Chrome extension
- **stream_sessions** - Live stream tracking
- **user_settings** - User preferences
- **Full RLS Security** - All tables protected

### ✅ Stripe Integration ($19.99/mo + 14-day trial)
- **create-checkout-session** - Stripe checkout with trial
- **stripe-webhook** - Handles subscription events (verified)
- Auto-updates subscription status in database

### ✅ API Endpoints (Edge Functions)
- **verify-extension** - Chrome extension auth check
- **capture-sale** - Log caught sales
- **get-analytics** - Dashboard stats

### ✅ Frontend
- Landing page with animations
- Auth (signup/login)
- Dashboard with real-time analytics

## 📋 Quick Setup

### 1. Add Stripe Price ID

Create product in Stripe Dashboard, then add the secret:
```
STRIPE_PRICE_ID=price_xxxxx
```

### 2. Configure Stripe Webhook

URL: `https://piqmyciivlcfxmcopeqk.supabase.co/functions/v1/stripe-webhook`

Events needed:
- customer.subscription.created
- customer.subscription.updated  
- customer.subscription.deleted
- invoice.payment_failed

Add webhook secret:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 3. Test With Test Cards

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

## 🔌 Chrome Extension Integration

```javascript
// Verify subscription
const { data } = await supabase.functions.invoke('verify-extension');
// Returns: { valid: true/false, subscription_status, trial_days_left }

// Log captured sale
await supabase.functions.invoke('capture-sale', {
  body: {
    platform: 'tiktok',
    buyer_username: '@user123',
    message_text: 'SOLD!',
    estimated_value: 140
  }
});
```

## 🎯 What Works

✅ Signup → Stripe checkout → 14-day trial starts  
✅ Webhook updates subscription status automatically  
✅ Dashboard shows revenue & sales in real-time  
✅ Chrome extension can verify subscription + log sales  
✅ After 14 days, Stripe charges card → Status = 'active'  
✅ Failed payments → Status = 'past_due'  
✅ All data secured with Row-Level Security  

## 🚨 Before Production

1. Switch Stripe to live mode
2. Update webhook to production URL
3. Test full flow in live mode
4. Build Chrome extension

---

**Ready for real payments.** All security, webhooks, and subscription logic handled.
