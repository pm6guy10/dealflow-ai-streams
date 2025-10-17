# 🚀 Quick Start: Real-Time Buyer Monitoring

Get your Whatnot stream monitoring up and running in 5 minutes!

## ✅ What You Get

- 📡 **Continuous chat monitoring** (checks every 1.5 seconds)
- 🤖 **AI-powered buyer detection** (Claude Sonnet analyzes every message)
- 💾 **Auto-saves to database** (all messages + high-confidence buyers)
- ⚡ **Real-time WebSocket updates** (instant notifications)
- 📊 **Live dashboard** (see buyers as they happen)

## 🏃‍♂️ Quick Setup

### 1. Deploy to Render (One-Time Setup)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Create New → Web Service
3. Connect your GitHub repo: `pm6guy10/dealflow-ai-streams`
4. Settings:
   - **Name**: `dealflow-ai-streams`
   - **Build Command**: `npm install`
   - **Start Command**: `node realtime-scraper.js`
   - **Instance Type**: Starter ($7/month) or Free

5. Add Environment Variables:
```bash
SUPABASE_URL=https://piqmyciivlcfxmcopeqk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<get-from-supabase-settings>
CHROME_EXECUTABLE_PATH=/opt/render/.cache/chromium/bin/chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PORT=3001
```

6. Click "Create Web Service" → Wait 5 minutes for deployment

### 2. Deploy Edge Function (One-Time Setup)

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref piqmyciivlcfxmcopeqk

# Deploy the edge function
supabase functions deploy monitor-realtime-stream

# Set the API key
supabase secrets set LOVABLE_API_KEY=<your-lovable-api-key>
```

### 3. Test It!

Open your browser console and run:

```javascript
// Start monitoring a Whatnot stream
const response = await fetch('https://dealflow-ai-streams.onrender.com/api/start-monitoring', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.whatnot.com/live/some-stream',
    sessionId: 'test-' + Date.now()
  })
})

const data = await response.json()
console.log('Monitoring started:', data)

// Connect to WebSocket to see live messages
const ws = new WebSocket('wss://dealflow-ai-streams.onrender.com')
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('📬 New event:', data)
}
```

## 🎯 How It Works

### The Flow

```
1. User clicks "Start Stream" in dashboard
   ↓
2. Frontend calls Render service: /api/start-monitoring
   ↓
3. Puppeteer opens Whatnot stream in headless browser
   ↓
4. Every 1.5 seconds: Extract new chat messages
   ↓
5. For each new message:
   ├─→ Send to Supabase edge function
   │   ├─→ Store in chat_messages table
   │   ├─→ Analyze with AI
   │   └─→ If buyer (≥70% confidence) → save to sales_captured
   └─→ Broadcast to WebSocket clients (instant UI update)
```

### What Gets Saved

**All Messages** → `chat_messages` table
```sql
{
  "id": "uuid",
  "stream_session_id": "uuid",
  "username": "buyer_mike",
  "message": "I'll take it!",
  "platform": "whatnot",
  "created_at": "2025-10-16T..."
}
```

**High-Confidence Buyers** → `sales_captured` table (auto)
```sql
{
  "id": "uuid",
  "user_id": "uuid",
  "stream_session_id": "uuid",
  "buyer_username": "buyer_mike",
  "message_text": "I'll take it!",
  "item_description": "vintage sneakers",
  "estimated_value": 120.00,
  "captured_at": "2025-10-16T..."
}
```

## 🔧 Integration with Your Dashboard

### Start Monitoring

```typescript
import { supabase } from '@/integrations/supabase/client'

const startMonitoring = async (whatnotUrl: string) => {
  // 1. Create stream session in database
  const { data: session } = await supabase
    .from('stream_sessions')
    .insert({ 
      user_id: user.id, 
      platform: 'whatnot' 
    })
    .select()
    .single()

  // 2. Start the realtime scraper
  const response = await fetch(
    `${import.meta.env.VITE_REALTIME_SCRAPER_URL}/api/start-monitoring`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: whatnotUrl,
        sessionId: session.id
      })
    }
  )

  // 3. Connect to WebSocket
  const ws = new WebSocket(import.meta.env.VITE_REALTIME_SCRAPER_WS)
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    if (data.type === 'buyer_detected') {
      // Show buyer alert in UI
      toast({
        title: '🔥 New Buyer!',
        description: `${data.buyer.username}: "${data.buyer.message}"`
      })
    }
  }

  return { session, ws }
}
```

### Stop Monitoring

```typescript
const stopMonitoring = async (sessionId: string, ws: WebSocket) => {
  // 1. Stop the scraper
  await fetch(
    `${import.meta.env.VITE_REALTIME_SCRAPER_URL}/api/stop-monitoring`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    }
  )

  // 2. Close WebSocket
  ws.close()

  // 3. Mark session as ended
  await supabase
    .from('stream_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId)
}
```

### Subscribe to Database Updates (Alternative to WebSocket)

```typescript
// Option: Use Supabase Realtime instead of WebSocket
const channel = supabase
  .channel(`stream:${sessionId}`)
  .on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'sales_captured',
      filter: `stream_session_id=eq.${sessionId}`
    },
    (payload) => {
      toast({
        title: '💰 Buyer Captured!',
        description: `${payload.new.buyer_username} - $${payload.new.estimated_value}`
      })
    }
  )
  .subscribe()
```

## 🎨 UI Components

### Buyer Alert Card

```tsx
interface BuyerAlert {
  username: string
  message: string
  confidence: number
  timestamp: string
}

const BuyerAlertCard = ({ buyer }: { buyer: BuyerAlert }) => (
  <Card className="border-green-500 bg-green-950/20">
    <CardContent className="pt-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">@{buyer.username}</p>
            <Badge variant="secondary" className="bg-green-500 text-white">
              {Math.round(buyer.confidence * 100)}% match
            </Badge>
          </div>
          <p className="text-sm text-gray-300 mt-1">{buyer.message}</p>
          <p className="text-xs text-gray-500 mt-2">{buyer.timestamp}</p>
        </div>
      </div>
    </CardContent>
  </Card>
)
```

### Live Chat Feed

```tsx
const LiveChatFeed = ({ messages }: { messages: ChatMessage[] }) => (
  <div className="h-96 overflow-y-auto space-y-2 p-4">
    {messages.map((msg) => (
      <div 
        key={msg.id}
        className={cn(
          "p-2 rounded",
          msg.isBuyer 
            ? "bg-green-950/30 border-l-2 border-green-500" 
            : "bg-gray-900/30"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{msg.username}</span>
          {msg.isBuyer && (
            <Badge variant="secondary" className="bg-green-600 text-xs">
              BUYER
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-300 mt-1">{msg.message}</p>
      </div>
    ))}
  </div>
)
```

## 📊 Stats Dashboard

```typescript
const getStreamStats = async (sessionId: string) => {
  // Get total messages
  const { count: messageCount } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('stream_session_id', sessionId)

  // Get buyers captured
  const { data: buyers } = await supabase
    .from('sales_captured')
    .select('*')
    .eq('stream_session_id', sessionId)

  // Calculate totals
  const totalValue = buyers?.reduce(
    (sum, b) => sum + (b.estimated_value || 0), 
    0
  ) || 0

  return {
    totalMessages: messageCount || 0,
    buyersCaptured: buyers?.length || 0,
    estimatedValue: totalValue,
    conversionRate: messageCount 
      ? ((buyers?.length || 0) / messageCount * 100).toFixed(1) 
      : 0
  }
}
```

## 🐛 Troubleshooting

### "Failed to connect to Render service"
- Check Render logs: https://dashboard.render.com/
- Verify environment variables are set
- Test health endpoint: `curl https://your-app.onrender.com/health`

### "No messages being detected"
- Check if stream URL is correct
- Enable screenshots: Set `DEALFLOW_SAVE_SCREENSHOT=true` on Render
- Look at Render logs for Puppeteer errors

### "AI analysis not working"
- Verify `LOVABLE_API_KEY` is set in Supabase
- Check function logs: `supabase functions logs monitor-realtime-stream`
- Test function directly (see REALTIME_MONITORING_SETUP.md)

## 💰 Cost Estimates

### Render
- Free tier: Works but spins down after inactivity (50s cold start)
- Starter ($7/mo): Always on, recommended for production

### Supabase
- Free tier: 50,000 monthly active users, 500MB database
- Pro ($25/mo): Unlimited, recommended for production

### AI Analysis (Lovable/Gemini)
- ~$0.000015 per message analyzed
- 1000 messages/day = ~$0.45/month
- 10,000 messages/day = ~$4.50/month

**Total estimated cost for active stream:**
- Development: $0 (free tiers)
- Production: ~$15-35/month (Render Starter + Supabase Pro)

---

## 🎉 You're Ready!

Your real-time monitoring system is configured and ready to catch buyers!

**Next steps:**
1. Test with a live Whatnot stream
2. Customize the AI prompts in `monitor-realtime-stream/index.ts`
3. Adjust confidence threshold (default 70%)
4. Add your own notification logic

Need help? Check `REALTIME_MONITORING_SETUP.md` for detailed docs.
