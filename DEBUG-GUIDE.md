# 🔍 DealFlow Debug Guide

## What We Added

### Backend Debug Logs (realtime-scraper.js)

**Console Output:**
```
🚀 Starting real-time monitoring for: [URL]
✅ Connected to stream: [URL]
📬 Found X new messages (Total: Y)
💬 Comment: @username said "message text"
🔥 BUYER INTENT DETECTED: @username - "message" | Confidence: 95% | Reason: keyword
✅ Saved buyer intent to storage
🔍 Scraping... (no new messages)
```

### Frontend Debug Panel (monitor.html)

**Real-time Stats:**
- ✅ **Connection Status**: Connected ✅ / Connecting... / Disconnected
- ⏱️ **Last Scrape**: Shows seconds since last scrape (e.g., "2s ago")
- 📊 **Msg/min**: Messages per minute rate

**Console Logs:**
- 📨 Every message received from WebSocket
- 🔥 Buyer alerts added to UI
- 💬 All chat messages (visible in collapsed chat feed)

---

## How to Debug

### 1. Check if Scraping is Working

**Backend (Render Logs):**
1. Go to: https://dashboard.render.com
2. Find your `dealflow-ai-streams` service
3. Click "Logs" tab
4. Look for:
   ```
   🚀 Starting real-time monitoring for: [URL]
   ✅ Connected to stream
   📬 Found X new messages
   💬 Comment: @user said "text"
   ```

**If you see:**
- ✅ `📬 Found X new messages` → Scraping IS working
- ❌ `🔍 Scraping... (no new messages)` → Either:
  - Stream has no activity
  - Scraping logic needs adjustment
  - Stream might be ended/private

### 2. Check if Buyer Detection is Working

**Look for in logs:**
```
🔥 BUYER INTENT DETECTED: @username - "I'll take it" | Confidence: 95% | Reason: ill take it
```

**If you see messages but NO buyer detections:**
- Messages don't contain buyer keywords
- Try a more active stream
- Check `BUYER_KEYWORDS` array in `realtime-scraper.js`

### 3. Check if WebSocket is Connected

**Frontend (Browser Console):**
1. Open DevTools (F12)
2. Look for:
   ```
   ✅ Connected to DealFlow WebSocket
   📨 Received message: new_message {...}
   ```

**On the page:**
- Connection status should show: **"Connected ✅"** (green)
- Last Scrape should update every 1-2 seconds

**If disconnected:**
- Red error banner appears: "Connection Lost"
- Try refreshing the page
- Check if Render backend is running

### 4. View All Messages (Not Just Buyers)

**Expand Chat Feed:**
1. Scroll down to "💬 Live Chat Feed"
2. Click to expand
3. You'll see ALL messages in real-time
4. Buyer messages are highlighted in green

**This helps answer:**
- ❓ Is scraping working at all?
- ❓ Are there messages but no buyers?
- ❓ What keywords are people using?

---

## Common Issues

### Issue: "Watching for buyers..." but nothing happens

**Diagnosis:**
1. Check backend logs → Are messages being scraped?
2. Check browser console → Is WebSocket connected?
3. Check "Last Scrape" → Is it updating?

**Solutions:**
- If logs show scraping but no UI updates → WebSocket issue
- If logs show nothing → Stream might be ended/inactive
- If "Last Scrape" not updating → Connection lost

### Issue: Messages appearing but no buyers detected

**Diagnosis:**
- Expand chat feed and see what people are saying
- Check if keywords match `BUYER_KEYWORDS`

**Solutions:**
- People might not be using buying keywords
- Try a busier stream (sports cards, sneakers, etc.)
- Adjust keyword detection if needed

### Issue: Connection keeps dropping

**Diagnosis:**
- Check Render logs for crashes
- Look for memory/CPU issues

**Solutions:**
- Restart Render service
- Check if multiple browser tabs are open
- Verify WebSocket URL is correct

---

## Testing Checklist

### Before Going Live:

- [ ] Backend logs show scraping activity
- [ ] Frontend shows "Connected ✅"
- [ ] "Last Scrape" updates every 1-2 seconds
- [ ] Messages appear in chat feed
- [ ] Buyer alerts pop up when keywords detected
- [ ] Stats (messages, buyers, value) update correctly
- [ ] Stop button works and redirects to summary

### Quick Test Stream:

Use a popular category on Whatnot:
- Sports cards (high activity)
- Sneakers (lots of buyers)
- Pokemon cards (very active chat)

Paste URL → Should see activity within 10-20 seconds

---

## Debug Stats Explained

| Stat | Meaning | What's Good |
|------|---------|-------------|
| Connection | WebSocket status | "Connected ✅" (green) |
| Last Scrape | Time since last scan | "1s ago" to "5s ago" |
| Msg/min | Message rate | 5-50 for active streams |
| Total Messages | All scraped | Growing number |
| Buyers | Intent detected | 1-5% of messages |

---

## Advanced Debugging

### Enable Verbose Logging:

In `realtime-scraper.js`, the scraper already logs:
- Every scraped comment
- Every buyer detection
- Every save operation

**To see more:**
- Check `console.log()` statements
- All are prefixed with emojis for easy filtering

### Test Locally:

```bash
# Run backend locally
npm start

# Frontend will connect to:
# http://localhost:3001
```

Change `API_BASE` in `monitor.html` to `http://localhost:3001` for local testing.

---

## Next Steps

1. **Test with real stream** → Paste active Whatnot URL
2. **Watch Render logs** → See scraping in action
3. **Check browser console** → Verify WebSocket messages
4. **Expand chat feed** → Confirm messages are flowing

**If everything works:**
- 📬 Messages appear in logs
- 🔥 Buyers pop up as alerts
- ✅ Connection stays green
- 📊 Stats update in real-time

**You're ready to go live!** 🚀

