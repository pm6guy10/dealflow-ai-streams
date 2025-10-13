# 🚀 DealFlow AI - Quick Start Guide

## What We Built

**Your AI assistant for Whatnot** - Finds missed buyers from ended streams and drafts personalized follow-up messages.

### The Magic Moment
Paste a stream URL → AI analyzes → Shows:
```
"You had 12 buying intents you would have missed.
Here are personalized messages - just click APPROVE! 🎯"
```

---

## 🔥 Try It NOW

**Live Demo:** https://dealflow-ai-streams-o7rv4bdax-brandons-projects-5552f226.vercel.app/stream-report.html

### How to Use:
1. Find an ended Whatnot stream URL
2. Paste it in the input box
3. (Optional) Add your seller name
4. Click "🤖 Analyze with AI"
5. Wait 30-60 seconds
6. Review AI-drafted messages
7. Click "✅ APPROVE & COPY" for each buyer
8. Paste into Whatnot DMs!

---

## ⚙️ Setup (For Development)

### 1. Install
```bash
cd dealflow-ai-streams
npm install
```

### 2. Add API Key
Create `.env` file:
```
ANTHROPIC_API_KEY=sk-ant-your_key_here
```

Get your key: https://console.anthropic.com/

### 3. Run Locally
```bash
npm start
```

Open: http://localhost:3001/stream-report.html

---

## 📦 What's Included

### Files Created:
- **`/lib/ai.js`** - Claude API integration
- **`api-analyze-stream.js`** - Main AI endpoint
- **`stream-report.html`** - Beautiful dashboard
- **`README-AI.md`** - Full documentation

### Features:
- ✅ Puppeteer scraping (extracts chat)
- ✅ AI intent detection (finds real buyers)
- ✅ AI message drafting (personalized DMs)
- ✅ Approve/Edit/Skip UI
- ✅ Copy to clipboard (one-click)
- ✅ Mobile-friendly design

---

## 🎯 Testing

### Test with a real stream:
```bash
curl -X POST http://localhost:3001/api/analyze-stream \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.whatnot.com/live/YOUR_STREAM_ID", "sellerName": "Sarah"}'
```

### Expected Response:
```json
{
  "success": true,
  "totalIntents": 5,
  "estimatedValue": 250,
  "intents": [
    {
      "username": "vintage_lover",
      "original_comment": "I need that blue sweater!",
      "drafted_message": "Hey! Yes, I have the blue sweater! It's $45. Want me to send you the payment link? 💙",
      "status": "pending"
    }
  ]
}
```

---

## 🚀 Deployment

### Frontend (Vercel) ✅
Already deployed: https://dealflow-ai-streams-o7rv4bdax-brandons-projects-5552f226.vercel.app

### Backend (Render) ⏳
1. Go to Render dashboard
2. Find `dealflow-ai-streams` service
3. Add environment variable:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...`
4. Manual deploy → "Clear cache & deploy"

---

## 💡 How It Works

### 1. Scraping
- Puppeteer opens the stream URL
- Extracts all chat messages
- Finds usernames + message text

### 2. AI Analysis
- Claude reads all messages
- Detects genuine buying intent
- Extracts: who, what, when, details

### 3. Message Drafting
- For each buyer, Claude writes a personalized DM
- Casual/friendly tone (Whatnot vibe)
- Confirms what they wanted
- Includes price estimate
- Asks about payment link

### 4. Dashboard
- Shows intent cards with:
  - Original comment
  - AI-drafted message
  - Approve/Edit/Skip buttons
- One-click copy to clipboard

---

## 🎨 UI Features

### Intent Card Example:
```
┌─────────────────────────────────────────┐
│ 👤 @vintage_queen                       │
│ 🕐 2:34 PM • high confidence            │
│                                          │
│ 💬 ORIGINAL COMMENT:                    │
│ "Omg love that blue sweater! Size M?"   │
│ Wants: blue sweater (size M)            │
│                                          │
│ 🤖 AI-DRAFTED MESSAGE:                  │
│ "Hey! Yes, I have the blue sweater in   │
│ size M! It's $45. Want me to send you   │
│ the payment link? 💙"                   │
│                                          │
│ [✅ APPROVE & COPY] [✏️ EDIT] [❌ SKIP] │
└─────────────────────────────────────────┘
```

---

## 📊 Success Metrics

This is successful if:
- ✅ Detects 90%+ of real buyers
- ✅ <10% false positives
- ✅ Messages sound natural
- ✅ Process 20 intents in <5 minutes

---

## 🔮 What's Next

### Immediate (Before Launch):
- [ ] Add ANTHROPIC_API_KEY to Render
- [ ] Test with 5 real streams
- [ ] Verify all messages sound natural

### Soon:
- [ ] Referral tracking (50% revenue share)
- [ ] Save analyses to database
- [ ] Email delivery option
- [ ] Batch processing (multiple streams)

### V2 (Premium Tier):
- [ ] Real-time alerts during live streams
- [ ] Auto-send via Whatnot API (if available)
- [ ] Advanced analytics dashboard

---

## 💰 Pricing Model

### Tier 1: Post-Stream Analysis ($79/mo)
- AI intent detection
- Message drafting
- Unlimited streams
- **This is what we built!**

### Tier 2: Real-Time Alerts ($150/mo)
- Everything in Tier 1
- Live alerts during stream
- Browser extension
- *Coming soon*

### Affiliate Program:
- 50% revenue share on referrals
- Unique referral codes
- Founding members: FREE lifetime

---

## 🆘 Need Help?

### Common Issues:

**"No buyer intent detected"**
- Try a more active stream
- Check stream has chat messages
- Verify API key is set

**"Failed to scrape stream"**
- Check URL is valid
- Stream must be ended (not live)
- Check Puppeteer logs

**"Messages don't sound natural"**
- You can edit before approving
- Tweak the prompt in `/lib/ai.js`
- Adjust temperature/style

---

## 📞 Contact

Questions? Found a bug?
- GitHub: https://github.com/pm6guy10/dealflow-ai-streams
- Issues: https://github.com/pm6guy10/dealflow-ai-streams/issues

---

**Built with ❤️ for Whatnot sellers**

**DNA:** "Your AI assistant for Whatnot - never miss a sale again" 🎯

