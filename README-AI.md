# DealFlow AI - Post-Stream Analysis with AI-Drafted Messages

## 🎯 THE MAGIC MOMENT

After a Whatnot stream ends, sellers get:
1. **AI Intent Detection** - Claude analyzes every chat message to find buyers
2. **Personalized DMs** - AI drafts custom follow-up messages for each buyer
3. **One-Click Actions** - Approve/Edit/Skip with copy-to-clipboard

**The emotional payoff:** "You had 12 buying intents you would have missed. Here are the messages - just click APPROVE!"

---

## 🚀 What's Built

### Core Features
- ✅ **Puppeteer Scraping** - Extracts chat from ended Whatnot streams
- ✅ **Claude AI Integration** - Detects genuine buying intent (not just keywords)
- ✅ **AI Message Drafting** - Generates casual, friendly DMs automatically
- ✅ **Dashboard UI** - Beautiful intent cards with approve/edit/skip buttons
- ✅ **Copy to Clipboard** - One-click to copy drafted messages

### AI Intent Detection
Uses Claude 3.5 Sonnet to analyze messages for:
- Direct purchase signals: "I'll take it", "sold", "mine"
- Availability questions: "do you have", "got size", "what colors"
- Payment/shipping questions
- Urgency: "hold it", "put me down"

**NOT flagged:**
- Generic compliments
- Greetings
- Spam

### AI Message Drafting
Each detected intent gets a personalized DM:
- Casual/friendly tone (Whatnot seller vibe)
- Confirms what they wanted
- Includes estimated price
- Asks if they want payment link
- Under 50 words
- 1-2 emojis max

---

## 📦 Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Add Anthropic API Key
Create a `.env` file (or set environment variable):
```
ANTHROPIC_API_KEY=sk-ant-your_key_here
```

Get your key from: https://console.anthropic.com/

### 3. Run Locally
```bash
npm start
```

Server runs on `http://localhost:3001`

### 4. Open UI
- **AI Analysis:** `http://localhost:3001/stream-report.html`
- **Basic Analysis:** `http://localhost:3001/index.html`

---

## 🎨 How to Use

1. **Open** `stream-report.html`
2. **Paste** a Whatnot stream URL (ended stream)
3. **Click** "🤖 Analyze with AI"
4. **Wait** 30-60 seconds while AI analyzes
5. **Review** detected buyers with drafted messages
6. **Approve** - Copies message to clipboard
7. **Edit** - Tweak the message first
8. **Skip** - Ignore this one

---

## 🏗️ File Structure

```
/lib
  /ai.js                    # Claude API integration
/api-analyze-stream.js      # Main AI analysis endpoint
/realtime-scraper.js        # Server with WebSocket (mounts AI endpoint)
/stream-report.html         # AI analysis dashboard UI
/index.html                 # Basic buyer detection (no AI)
```

---

## 📊 API Endpoints

### POST `/api/analyze-stream`
Scrapes a stream + runs AI analysis.

**Request:**
```json
{
  "url": "https://www.whatnot.com/live/...",
  "sellerName": "Sarah",
  "category": "vintage clothing"
}
```

**Response:**
```json
{
  "success": true,
  "totalMessages": 247,
  "totalIntents": 12,
  "estimatedValue": 600,
  "intents": [
    {
      "username": "jessica_vintage",
      "timestamp": "2025-10-13T01:34:00Z",
      "original_comment": "Omg I love that blue sweater! Do you have size M?",
      "item_wanted": "blue sweater",
      "details": "size M",
      "drafted_message": "Hey Jessica! Yes, I have the blue sweater in size M! It's $45. Want me to send you the payment link? 💙",
      "confidence": "high",
      "status": "pending"
    }
  ],
  "magicMoment": "You had 12 buying intents you might have missed. Here are personalized messages - just click APPROVE! 🎯"
}
```

---

## 🎯 Success Metrics

This is successful if:
- ✅ Detects 90%+ of actual buying intent (no false negatives)
- ✅ <10% false positives (don't flag non-buyers)
- ✅ Messages sound natural (seller doesn't need to rewrite)
- ✅ Seller can process 20 intents in under 5 minutes

---

## 💰 Pricing Tiers (Future)

- **$79/mo** - Post-stream reports + AI-drafted messages
- **$150/mo** - Real-time alerts during live streams (V2)

### Referral System (Future)
- 50% revenue share on all referrals
- Unique referral codes per user
- Founding members: FREE lifetime + 50% share forever

---

## 🚀 Deployment

### Deploy Backend (Render)
1. Push to GitHub
2. Deploy `realtime-scraper.js` on Render
3. Add environment variables:
   - `ANTHROPIC_API_KEY`
   - `RENDER=true`

### Deploy Frontend (Vercel)
1. `vercel deploy --prod`
2. Update `window.DEALFLOW_API_BASE` in HTML files if needed

---

## 🧪 Testing

### Test with a real stream:
```bash
curl -X POST http://localhost:3001/api/analyze-stream \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.whatnot.com/live/YOUR_STREAM_ID", "sellerName": "Test"}'
```

---

## 🔮 Next Steps

1. ✅ Core AI features (DONE)
2. ⏳ Referral tracking system
3. ⏳ Database to save analyses
4. ⏳ Email delivery option
5. ⏳ Real-time alerts (V2)
6. ⏳ Auto-send via Whatnot API (if available)

---

## 🆘 Troubleshooting

**"Missing ANTHROPIC_API_KEY"**
- Add it to `.env` file or environment variables

**"Failed to scrape stream"**
- Check if stream URL is valid
- Try a different (ended) stream
- Check Puppeteer logs

**"No buyer intent detected"**
- Stream might have very few messages
- Try a more active stream

---

**Built with:** Puppeteer + Claude AI + Express + Tailwind CSS

**DNA:** "Your AI assistant for Whatnot - never miss a sale again"

