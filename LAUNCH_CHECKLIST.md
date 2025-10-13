# 🚀 Launch Checklist - Post-Stream Reports

Use this checklist to verify everything is working before launching to users.

---

## ✅ Pre-Launch Setup

### 1. API Keys & Secrets
- [ ] **Claude API key** set in Supabase Edge Functions secrets
  - Go to: Supabase Dashboard → Project Settings → Edge Functions → Secrets
  - Add: `ANTHROPIC_API_KEY` = `sk-ant-xxxxx`
  - Test: Should have access to Claude 3.5 Sonnet

- [ ] **Stripe keys** configured (if not already)
  - `STRIPE_PRICE_ID` for $79/mo plan
  - `STRIPE_WEBHOOK_SECRET` for webhook verification

- [ ] **Supabase keys** in frontend .env
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

### 2. Database Migration
- [ ] Run `supabase db push` successfully
- [ ] Verify tables exist:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('stream_analyses', 'message_approvals', 'referrals', 'referral_earnings');
  ```
- [ ] Check RLS policies are enabled on all new tables
- [ ] Verify indexes are created (check migration file)

### 3. Supabase Functions Deployment
- [ ] Deploy `analyze-stream-intents`
  ```bash
  supabase functions deploy analyze-stream-intents
  ```
- [ ] Deploy `update-message-status`
  ```bash
  supabase functions deploy update-message-status
  ```
- [ ] Test both functions return 401 (auth required) when called without token
- [ ] Check logs in Supabase Dashboard → Edge Functions

### 4. Scraper Server
- [ ] Install dependencies: `npm install`
- [ ] Start server: `npm start`
- [ ] Verify running on http://localhost:3001
- [ ] Test endpoint:
  ```bash
  curl -X POST http://localhost:3001/api/scrape-stream \
    -H "Content-Type: application/json" \
    -d '{"url":"https://www.whatnot.com/live/test"}'
  ```
- [ ] Should return JSON (even if empty)

### 5. Frontend Build
- [ ] Install dependencies: `npm install` (in /workspace)
- [ ] Start dev server: `npm run dev`
- [ ] Open http://localhost:8080
- [ ] No console errors
- [ ] Dashboard loads correctly

---

## ✅ Feature Testing

### Test 1: Basic Navigation
- [ ] Navigate to http://localhost:8080/dashboard
- [ ] See three tabs: Live Monitoring, Post-Stream Reports, Referrals
- [ ] Click each tab, no errors
- [ ] UI renders correctly on desktop
- [ ] UI renders correctly on mobile (responsive)

### Test 2: Post-Stream Analysis Flow
- [ ] Go to "Post-Stream Reports" tab
- [ ] See `StreamAnalyzer` component with input field
- [ ] Paste a test Whatnot URL (or use any you know)
- [ ] Click "Analyze Stream with AI"
- [ ] See progress indicator: "Scraping stream comments..."
- [ ] Wait 15-30 seconds
- [ ] See success toast: "🎉 Analysis Complete!"
- [ ] Navigate to report page automatically
- [ ] See `StreamAnalysis` view with stats cards
- [ ] Verify stats are accurate (Total Intents, etc.)

### Test 3: Intent Cards
- [ ] See list of buyer intent cards
- [ ] Each card shows:
  - [ ] Username with @ symbol
  - [ ] Timestamp (formatted correctly)
  - [ ] Original comment in gray box
  - [ ] Item wanted + details
  - [ ] Drafted message in blue box
  - [ ] Three action buttons (APPROVE, EDIT, SKIP)
- [ ] Cards are styled correctly (gradients, borders)
- [ ] Mobile-friendly layout

### Test 4: Message Approval
- [ ] Click **✏️ EDIT** button on a card
- [ ] Textarea appears with editable message
- [ ] Modify the message text
- [ ] Click "Save Changes"
- [ ] See updated message in blue box
- [ ] Click **✅ APPROVE & SEND**
- [ ] See toast: "✅ Message Copied!"
- [ ] Paste from clipboard - should be the message text
- [ ] Card turns green with "✓ Approved & Copied"
- [ ] Check database: `message_approvals` table has new row

### Test 5: Message Skip
- [ ] Click **❌ SKIP** button on a card
- [ ] See toast: "Message Skipped"
- [ ] Card turns gray/transparent
- [ ] Check database: status = 'skipped'

### Test 6: Export CSV
- [ ] Click "Export CSV" button at top
- [ ] File downloads: `whatnot-buyers-YYYY-MM-DD.csv`
- [ ] Open CSV - should have all intents with columns:
  - Username, Timestamp, Comment, Item Wanted, Details, Message, Status

### Test 7: Referral Dashboard
- [ ] Go to "Referrals" tab
- [ ] See referral code automatically generated
- [ ] Copy referral link
- [ ] Paste - should be: `https://dealflow.ai/signup?ref=DEALFLOWXXXXXX`
- [ ] See stats: Lifetime Earnings ($0.00 initially)
- [ ] See: Active Referrals (0 initially)
- [ ] See: Monthly Recurring ($0.00 initially)
- [ ] UI looks professional and complete

---

## ✅ Error Handling Tests

### Test 8: Invalid Stream URL
- [ ] Go to Post-Stream Reports
- [ ] Enter invalid URL: "not-a-url"
- [ ] Click Analyze
- [ ] See error toast: "Invalid URL"
- [ ] No crash, can try again

### Test 9: Stream with No Comments
- [ ] Enter a Whatnot URL with no comments (or very old stream)
- [ ] Click Analyze
- [ ] See: "No Comments Found" toast
- [ ] Or see: "No Buyer Intents Found" in report
- [ ] No crash, graceful handling

### Test 10: Scraper Server Down
- [ ] Stop the scraper server (Ctrl+C)
- [ ] Try to analyze a stream
- [ ] See error: "Failed to scrape stream"
- [ ] Restart scraper
- [ ] Try again - should work

### Test 11: Claude API Key Missing
- [ ] Temporarily remove `ANTHROPIC_API_KEY` from Supabase
- [ ] Try to analyze a stream
- [ ] Should see error in function logs
- [ ] Error handled gracefully in UI
- [ ] Re-add API key
- [ ] Try again - should work

---

## ✅ Database Verification

### Test 12: Data Persistence
- [ ] Complete an analysis
- [ ] Refresh the page
- [ ] Navigate back to the report (you'll need the URL)
- [ ] Data is still there
- [ ] Query database:
  ```sql
  SELECT * FROM stream_analyses ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] See your analysis with correct data

### Test 13: Row-Level Security
- [ ] Create two test users
- [ ] User A creates an analysis
- [ ] Log in as User B
- [ ] User B should NOT see User A's analyses
- [ ] Try to query User A's data - should be blocked by RLS

### Test 14: Referral Tracking
- [ ] Check `referrals` table
- [ ] Should have one row per user with unique referral_code
- [ ] Query:
  ```sql
  SELECT referral_code, tier, lifetime_earnings FROM referrals;
  ```
- [ ] Verify codes are unique

---

## ✅ Performance & UX

### Test 15: Speed
- [ ] Time a full analysis
- [ ] Should complete in 15-30 seconds for typical stream
- [ ] If >30 seconds, check:
  - Claude API response time
  - Scraper performance
  - Network connection

### Test 16: Mobile Experience
- [ ] Open on mobile device or use Chrome DevTools mobile view
- [ ] Dashboard is responsive
- [ ] Intent cards stack vertically
- [ ] Buttons are tap-friendly (big enough)
- [ ] Text is readable
- [ ] No horizontal scroll

### Test 17: User Flow
- [ ] Time yourself processing 10 intents
- [ ] Should take <5 minutes total
- [ ] No confusion about what to do next
- [ ] Clear visual feedback on each action

---

## ✅ Claude API Testing

### Test 18: Intent Detection Accuracy
- [ ] Find a stream with obvious buying intent
- [ ] Comments like: "I'll take it", "sold", "mine", "size 10?"
- [ ] Run analysis
- [ ] Verify these are detected (high confidence >0.7)
- [ ] Check for false positives (casual comments detected as intent)
- [ ] Aim for: <10% false positive rate

### Test 19: Message Quality
- [ ] Review generated messages
- [ ] Should be:
  - [ ] Casual and friendly (not corporate)
  - [ ] Under 50 words
  - [ ] 1-2 emoji max
  - [ ] Confirms what they wanted
  - [ ] Asks about payment link
- [ ] If messages are too formal, adjust prompts in:
  `/workspace/supabase/functions/analyze-stream-intents/index.ts`

---

## ✅ Production Readiness

### Test 20: Deployment Prep
- [ ] All secrets documented
- [ ] Environment variables listed in README
- [ ] Database schema in version control (migration file)
- [ ] No hardcoded URLs or keys in code
- [ ] Console.logs removed or conditional (dev only)

### Test 21: Cost Estimation
- [ ] Estimate Claude API costs for your expected volume
- [ ] 100 analyses/day × $0.20 avg = $20/day = $600/month
- [ ] Adjust pricing if needed
- [ ] Set up billing alerts in Anthropic console

### Test 22: Monitoring Setup
- [ ] Know where to check logs:
  - Supabase: Dashboard → Edge Functions → Logs
  - Scraper: Terminal output (or log file)
  - Frontend: Browser console
- [ ] Set up error tracking (optional: Sentry, LogRocket)

---

## ✅ Documentation Check

### Test 23: User Docs
- [ ] README.md is updated
- [ ] QUICK_START.md is clear and accurate
- [ ] POST_STREAM_REPORTS_SETUP.md covers all features
- [ ] ARCHITECTURE.md explains system design
- [ ] All links work

### Test 24: Developer Handoff
- [ ] Code is commented where needed
- [ ] Component props are typed (TypeScript)
- [ ] API endpoints are documented
- [ ] Database schema is clear

---

## ✅ Final Pre-Launch

### Test 25: End-to-End Test
- [ ] Fresh browser session (incognito mode)
- [ ] Sign up as new user
- [ ] Navigate to Post-Stream Reports
- [ ] Analyze a real stream
- [ ] Approve 3 messages
- [ ] Skip 1 message
- [ ] Export CSV
- [ ] Check Referrals tab
- [ ] Everything works perfectly

### Test 26: First User Experience
- [ ] Have someone else test (non-technical if possible)
- [ ] They should understand it in 5 seconds
- [ ] No confusion about what to do
- [ ] "Magic moment" is clear: "Wow, I missed these buyers!"

---

## 🎉 Launch Checklist Complete!

When all boxes are checked:
- ✅ Feature is working end-to-end
- ✅ Errors are handled gracefully
- ✅ Performance is acceptable
- ✅ Documentation is complete
- ✅ Ready for first users

### Next Steps:
1. **Deploy to production**
   - Frontend: Vercel/Netlify
   - Scraper: Render/Railway
   
2. **Announce to founding members**
   - "Post-Stream Reports are live!"
   - Free lifetime access + 50% revenue share
   
3. **Collect feedback**
   - Message quality
   - Intent detection accuracy
   - UX improvements

4. **Iterate**
   - Adjust prompts based on feedback
   - Add requested features
   - Fix any bugs

---

**You're ready to ship! 🚀**

Print this checklist and check off each item as you go. Good luck with the launch!
