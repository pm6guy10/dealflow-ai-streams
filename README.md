# DealFlow - Whatnot Seller Tool

Your AI assistant for Whatnot - never miss a sale again.

---

## 🎯 NEW: Post-Stream Reports Feature

**The magic moment for sellers**: After a stream ends, get an AI-powered report showing all the buyers you missed, with personalized messages ready to send.

### ✨ What You Get:
- 🎯 **AI detects buying intent** from stream comments (Claude 3.5 Sonnet)
- ✨ **Personalized DMs drafted** for each buyer (casual, friendly tone)
- 📋 **One-click approve & copy** to clipboard
- 💰 **Estimated value** of missed sales
- 📊 **Beautiful dashboard** with stats and progress tracking
- 💸 **50% revenue share** on all referrals

### 📚 Quick Links:
- **⚡ [Quick Start Guide](QUICK_START.md)** - Get running in 5 minutes
- **📘 [Full Documentation](POST_STREAM_REPORTS_SETUP.md)** - Complete setup guide
- **📖 [Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - What was built
- **🏗️ [Architecture Docs](ARCHITECTURE.md)** - Technical deep dive

### 🚀 Ready to Ship!
All core functionality is implemented and ready to test. This is your **$79/mo tier feature** that helps sellers recover missed sales.

---

# DealFlow - Production-Ready SaaS Backend

**Complete Stripe subscriptions + Auth + Chrome Extension API**

## 🚀 What's Built

### ✅ NEW: Post-Stream Reports (AI-Powered)
- **AI Intent Detection** - Claude 3.5 Sonnet analyzes stream comments
- **Message Generation** - Personalized DMs for each buyer
- **Approval Dashboard** - Review and approve messages with one click
- **Referral Program** - 50% revenue share tracking
- **Full UI Components** - IntentCard, StreamAnalysis, ReferralDashboard

### ✅ Database (PostgreSQL)
- **profiles** - Users with Stripe data & subscription status
- **sales_captured** - Every sale logged by Chrome extension
- **stream_sessions** - Live stream tracking
- **stream_analyses** - Post-stream AI analysis results (NEW)
- **message_approvals** - Message approval tracking (NEW)
- **referrals** - Referral program tracking (NEW)
- **referral_earnings** - Revenue share payouts (NEW)
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
- **analyze-stream-intents** - AI analysis of stream comments (NEW)
- **update-message-status** - Track message approvals (NEW)

### ✅ Frontend
- Landing page with animations
- Auth (signup/login)
- Dashboard with real-time analytics
- **Post-Stream Reports Tab** with AI-drafted messages (NEW)
- **Referral Dashboard** with earnings tracking (NEW)

---

## 📋 Quick Setup

### 1. Add API Keys

```bash
# Claude API (required for post-stream reports)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Stripe (existing)
STRIPE_PRICE_ID=price_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

Get your Claude API key from: https://console.anthropic.com/

### 2. Configure Stripe Webhook

URL: `https://piqmyciivlcfxmcopeqk.supabase.co/functions/v1/stripe-webhook`

Events needed:
- customer.subscription.created
- customer.subscription.updated  
- customer.subscription.deleted
- invoice.payment_failed

### 3. Run Database Migrations

```bash
# Deploy all migrations including new post-stream tables
supabase db push
```

### 4. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy analyze-stream-intents
supabase functions deploy update-message-status
supabase functions deploy verify-extension
supabase functions deploy capture-sale
supabase functions deploy get-analytics
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy customer-portal
```

### 5. Start Scraper Server

```bash
# Required for post-stream analysis
npm start
# Runs on http://localhost:3001
```

### 6. Test Post-Stream Reports

1. Go to http://localhost:8080/dashboard
2. Click "Post-Stream Reports" tab
3. Paste a Whatnot stream URL
4. Click "Analyze Stream with AI"
5. See your buyer intents! 🎉

---

## 💰 Pricing Tiers

### Post-Stream Reports ($79/mo)
- AI-powered intent detection
- Personalized message generation
- Unlimited analyses
- 50% revenue share on referrals

### Founding Member Tiers (Built-in)
- **First 10**: FREE forever + 50% revenue share
- **Next 40**: $99 one-time + 50% revenue share
- **Regular**: $79/mo + 50% revenue share

---

## 📊 Features

### Live Monitoring
- Real-time comment tracking during streams
- Buyer intent detection with confidence scoring
- Chat visualization in dashboard

### Post-Stream Reports (NEW)
- Full stream analysis with AI
- Intent detection from all comments
- Personalized message generation
- One-click approve & copy
- CSV export functionality

### Referral Program (NEW)
- Automatic referral code generation
- 50% revenue share ($40/mo per referral)
- Earnings dashboard
- Tier-based benefits

### Analytics
- Total sales captured
- Revenue estimates
- Stream statistics
- Message approval rates

---

## 🏗️ Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: Claude 3.5 Sonnet (Anthropic)
- **Scraping**: Puppeteer (Node.js)
- **Auth**: Supabase Auth
- **Payments**: Stripe
- **Hosting**: Vercel (recommended)

---

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - 5-minute setup guide
- **[POST_STREAM_REPORTS_SETUP.md](POST_STREAM_REPORTS_SETUP.md)** - Detailed feature docs
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What was built
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture
- **[DEPLOY.md](DEPLOY.md)** - Deployment guide

---

## 🚀 Deployment

### Recommended Stack
- **Frontend**: Vercel (auto-deploy from GitHub)
- **Scraper**: Render/Railway/Fly.io
- **Database**: Supabase (already hosted)
- **Functions**: Supabase (already hosted)

### Environment Variables
```bash
# Supabase
VITE_SUPABASE_URL=https://piqmyciivlcfxmcopeqk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...

# Stripe (in Supabase Edge Functions)
STRIPE_PRICE_ID=price_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Claude (in Supabase Edge Functions)
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

## 🎯 Success Metrics

The post-stream reports feature is successful when:
- ✅ Detects 90%+ of actual buying intent
- ✅ <10% false positives
- ✅ Messages sound natural (minimal editing)
- ✅ Process 20 intents in <5 minutes
- ✅ Clear ROI ($50/buyer × intents found)

---

## 🐛 Troubleshooting

### "ANTHROPIC_API_KEY not configured"
→ Add your Claude API key to Supabase Edge Functions secrets

### "Failed to scrape stream"
→ Make sure the scraper server is running (`npm start`)

### "Analysis not found"
→ Check that database migrations ran successfully

### "No comments provided"
→ The stream has no comments. Try a different URL.

---

## 📞 Support

For detailed troubleshooting, see:
- [QUICK_START.md](QUICK_START.md) - Common issues
- [POST_STREAM_REPORTS_SETUP.md](POST_STREAM_REPORTS_SETUP.md) - Setup problems
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details

---

## 🎉 Ready to Launch!

All features are implemented and ready to ship:
- ✅ Live monitoring (existing)
- ✅ Post-stream reports with AI (NEW)
- ✅ Referral program (NEW)
- ✅ Stripe integration (existing)
- ✅ Beautiful UI (enhanced)

**Let's ship this week! 🚀**

---

*Built with ❤️ for Whatnot sellers who never want to miss a sale again.*
