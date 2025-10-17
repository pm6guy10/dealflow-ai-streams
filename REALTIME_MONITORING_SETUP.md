# Real-Time Stream Monitoring Setup Guide

## 🎯 Overview

DealFlow now supports **real-time chat monitoring** that continuously watches Whatnot streams and automatically detects buyer intent as messages appear. This guide explains how the system works and how to set it up.

## 🏗️ Architecture

### Components

1. **realtime-scraper.js** (Node.js service on Render)
   - Runs Puppeteer to monitor Whatnot streams
   - Extracts chat messages as they appear (polls every 1.5 seconds)
   - Broadcasts messages via WebSocket to connected clients
   - Sends messages to Supabase for storage and AI analysis

2. **monitor-realtime-stream** (Supabase Edge Function)
   - Receives individual messages from the realtime scraper
   - Stores messages in `chat_messages` table
   - Analyzes each message with AI for buying intent
   - Auto-captures high-confidence buyers to `sales_captured` table

3. **Dashboard** (React Frontend)
   - Connects to realtime scraper via WebSocket
   - Shows live chat feed
   - Displays buyer alerts in real-time
   - Subscribes to Supabase realtime for database updates

### Data Flow

```
Whatnot Stream
    ↓
Puppeteer (realtime-scraper.js)
    ↓
Extract New Messages (every 1.5s)
    ↓
    ├─→ WebSocket → Frontend Dashboard (instant display)
    └─→ Supabase Edge Function → AI Analysis → Database
                                      ↓
                              Auto-save buyers to sales_captured
```

## 🚀 Deployment Setup

### 1. Deploy Realtime Scraper to Render

The `realtime-scraper.js` needs to run continuously on a server. We use Render.com:

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
node realtime-scraper.js
```

**Environment Variables on Render:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CHROME_EXECUTABLE_PATH=/opt/render/.cache/chromium/bin/chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PORT=3001
```

### 2. Deploy Edge Function to Supabase

```bash
# Deploy the new edge function
supabase functions deploy monitor-realtime-stream

# Set required environment variables
supabase secrets set LOVABLE_API_KEY=your-api-key
```

### 3. Configure Frontend

Update your frontend to connect to the Render service:

**Environment Variables (.env):**
```bash
VITE_REALTIME_SCRAPER_URL=https://your-app.onrender.com
VITE_REALTIME_SCRAPER_WS=wss://your-app.onrender.com
```

## 🔧 How to Use

### Start Monitoring a Stream

```typescript
// Create a stream session
const { data: session } = await supabase
  .from('stream_sessions')
  .insert({
    user_id: user.id,
    platform: 'whatnot'
  })
  .select()
  .single()

// Start the realtime scraper
const response = await fetch(`${REALTIME_SCRAPER_URL}/api/start-monitoring`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.whatnot.com/live/stream-url',
    sessionId: session.id
  })
})

// Connect to WebSocket for live updates
const ws = new WebSocket(REALTIME_SCRAPER_WS)
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  
  if (data.type === 'buyer_detected') {
    console.log('🔥 New buyer:', data.buyer)
  }
  
  if (data.type === 'new_message') {
    console.log('💬 New message:', data.message)
  }
}
```

### Stop Monitoring

```typescript
await fetch(`${REALTIME_SCRAPER_URL}/api/stop-monitoring`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: session.id
  })
})

ws.close()
```

### Subscribe to Database Updates (Alternative/Additional)

```typescript
// Subscribe to new chat messages
const messagesChannel = supabase
  .channel('chat_messages')
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'chat_messages',
      filter: `stream_session_id=eq.${sessionId}`
    },
    (payload) => {
      console.log('New message from DB:', payload.new)
    }
  )
  .subscribe()

// Subscribe to new buyer captures
const buyersChannel = supabase
  .channel('sales_captured')
  .on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'sales_captured',
      filter: `stream_session_id=eq.${sessionId}`
    },
    (payload) => {
      console.log('🎉 New buyer captured:', payload.new)
    }
  )
  .subscribe()
```

## 🧪 Testing

### Test the Realtime Scraper

```bash
# Start the scraper locally
npm install
node realtime-scraper.js

# In another terminal, test it
curl -X POST http://localhost:3001/api/start-monitoring \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.whatnot.com/live/test-stream", "sessionId": "test-123"}'
```

### Test the Edge Function

```bash
curl -X POST https://your-project.supabase.co/functions/v1/monitor-realtime-stream \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I will take it!",
    "username": "test_buyer",
    "streamSessionId": "your-session-id",
    "platform": "whatnot"
  }'
```

## 🐛 Troubleshooting

### Messages not being detected

1. **Check Puppeteer is finding the chat container**
   - Set `DEALFLOW_SAVE_SCREENSHOT=true` to capture screenshots
   - Look at the screenshots to verify chat is visible

2. **Check Supabase connection**
   - Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set on Render
   - Check Render logs for connection errors

3. **Check AI analysis**
   - Verify `LOVABLE_API_KEY` is set in Supabase secrets
   - Check edge function logs: `supabase functions logs monitor-realtime-stream`

### High costs / too many AI calls

The system analyzes EVERY message with AI. To reduce costs:

1. **Filter messages before AI analysis**
   - Add keyword pre-filtering (only analyze messages with buyer keywords)
   - Only analyze messages from certain users

2. **Use local detection only**
   - Remove the AI call from the edge function
   - Use the existing keyword-based `detectBuyer()` function

3. **Batch messages**
   - Collect messages and analyze in batches every 10-30 seconds

## 📊 Database Schema

### chat_messages
Stores ALL chat messages (analyzed or not)
```sql
- id: UUID
- stream_session_id: UUID → stream_sessions(id)
- username: TEXT
- message: TEXT
- platform: TEXT
- created_at: TIMESTAMP
```

### sales_captured
Auto-populated when AI detects high-confidence buyers (≥70%)
```sql
- id: UUID
- user_id: UUID → profiles(id)
- stream_session_id: UUID → stream_sessions(id)
- platform: TEXT
- buyer_username: TEXT
- message_text: TEXT
- item_description: TEXT
- estimated_value: DECIMAL
- captured_at: TIMESTAMP
```

## 🎛️ Configuration Options

### Polling Interval
Default: 1500ms (1.5 seconds)

Change in `realtime-scraper.js`:
```javascript
interval: setInterval(async () => {
  // monitoring code
}, 1500) // ← Change this value
```

### AI Confidence Threshold
Default: 0.7 (70%)

Change in `monitor-realtime-stream/index.ts`:
```typescript
if (analysis.is_buyer && analysis.confidence >= 0.7) { // ← Change this
  // auto-capture buyer
}
```

### Message Deduplication
Uses LRU cache with 10,000 messages, 5-minute TTL

Change in `realtime-scraper.js`:
```javascript
const seenMessages = new LRU({ 
  max: 10000,  // ← Max messages to track
  ttl: 1000 * 60 * 5  // ← Time to live (5 minutes)
});
```

## 🚦 Status & Health Check

Check if the scraper is running:
```bash
curl https://your-app.onrender.com/health
```

Response:
```json
{
  "status": "ok",
  "service": "DealFlow Real-Time Monitor",
  "activeSessions": 2
}
```

## 📈 Performance Tips

1. **Use WebSocket for instant updates** - Faster than database polling
2. **Enable Supabase Realtime** - Subscribe to database changes for redundancy
3. **Monitor Render logs** - Watch for memory leaks or browser crashes
4. **Auto-restart on failure** - Enable Render's auto-restart feature
5. **Use serverless Chromium** - Already configured with `@sparticuz/chromium`

## 🔐 Security Notes

1. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** - Only set on server (Render)
2. **Use RLS policies** - Already configured for `chat_messages` and `sales_captured`
3. **Validate session ownership** - Frontend should only access own sessions
4. **Rate limit API calls** - Add rate limiting to prevent abuse

---

## 🎉 You're All Set!

Your real-time monitoring system is now ready to catch every buyer in your Whatnot streams!

For questions or issues, check the Render logs and Supabase function logs.
