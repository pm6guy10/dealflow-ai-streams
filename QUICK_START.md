# ⚡ Quick Start Guide - Post-Stream Reports

## 🚀 Get Up and Running in 5 Minutes

### Step 1: Set Claude API Key (REQUIRED)

Get your API key from: https://console.anthropic.com/

Then add to Supabase:
```bash
# Option A: Using Supabase CLI
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here

# Option B: Via Dashboard
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Settings → Edge Functions → Secrets
# 4. Add: ANTHROPIC_API_KEY = sk-ant-your-key-here
```

### Step 2: Run Database Migration

```bash
# Make sure you're in /workspace directory
cd /workspace

# Push migrations to Supabase
supabase db push

# Or manually copy SQL from:
# /workspace/supabase/migrations/20250113000000_stream_analyses.sql
```

### Step 3: Deploy Supabase Functions

```bash
# Deploy both new functions
supabase functions deploy analyze-stream-intents
supabase functions deploy update-message-status

# Verify they're deployed
supabase functions list
```

### Step 4: Start Scraper Server

```bash
# In /workspace directory
npm start

# Should see:
# 🚀 DealFlow running on port 3001
```

### Step 5: Test It!

1. Open http://localhost:8080/dashboard
2. Click "Post-Stream Reports" tab
3. Paste a Whatnot URL (example: https://www.whatnot.com/live/username)
4. Click "Analyze Stream with AI"
5. Wait ~20 seconds
6. See your buyer intents! 🎉

---

## 🧪 Test with Demo Stream

If you don't have a Whatnot URL handy, use the demo mode:
1. Go to "Live Monitoring" tab
2. Click "Start" without entering a URL
3. Watch fake claims appear
4. Then switch to "Post-Stream Reports" to test the analysis

---

## ❓ Troubleshooting

### "ANTHROPIC_API_KEY not configured"
→ You didn't set the API key. Go to Supabase secrets and add it.

### "Failed to scrape stream"
→ Scraper server isn't running. Start it with `npm start`.

### "Analysis not found"
→ Database migration didn't run. Run `supabase db push`.

### "No comments provided"
→ The stream has no comments. Try a different URL with more activity.

---

## 📊 What to Expect

**For a typical stream with 50 comments:**
- Analysis time: ~20 seconds
- Buyer intents found: 3-8 (depends on stream)
- Messages generated: Same as intents
- Cost: ~$0.15 (Claude API)

---

## ✅ Success Checklist

- [ ] Claude API key is set in Supabase
- [ ] Database migration ran successfully
- [ ] Both Supabase functions are deployed
- [ ] Scraper server is running on port 3001
- [ ] Frontend dev server is running on port 8080
- [ ] You can access the Dashboard
- [ ] "Post-Stream Reports" tab is visible
- [ ] Analyzed a test stream successfully

---

## 🎯 Next Steps After Testing

1. **Deploy to production**:
   - Deploy scraper to Render/Railway/Vercel
   - Update scraper URL in StreamAnalyzer.tsx
   
2. **Add your branding**:
   - Update "Deal Flow" to your app name
   - Customize colors in tailwind.config.ts
   
3. **Set up Stripe**:
   - Already integrated for subscriptions
   - Configure $79/mo plan
   - Add founding member pricing

4. **Launch to first users**:
   - Start with founding members (FREE)
   - Get feedback on message quality
   - Iterate on prompts if needed

---

## 🔗 Useful Links

- **Claude API Console**: https://console.anthropic.com/
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Claude Pricing**: https://anthropic.com/pricing
- **Your API Documentation**: Check POST_STREAM_REPORTS_SETUP.md

---

**You're ready to ship! 🚀**

Need help? Check IMPLEMENTATION_SUMMARY.md for detailed docs.
