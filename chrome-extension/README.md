# DealFlow Chrome Extension

This Chrome extension automatically detects purchase intent in live stream chats on YouTube, TikTok, Whatnot, Facebook, and Instagram.

## Installation Instructions

### Step 1: Download the Extension Files
All the extension files are in the `chrome-extension/` folder of your project.

### Step 2: Enable Developer Mode in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Toggle "Developer mode" ON (top right corner)

### Step 3: Load the Extension
1. Click "Load unpacked" button
2. Select the `chrome-extension` folder from your project
3. The DealFlow extension should now appear in your extensions list

### Step 4: Get Your Auth Token
1. Go to your DealFlow app at https://piqmyciivlcfxmcopeqk.lovable.app
2. Sign in to your account
3. Open browser DevTools (F12)
4. Go to Console tab
5. Type: `localStorage.getItem('supabase.auth.token')`
6. Copy the token (it starts with "eyJ...")

### Step 5: Configure the Extension
1. Click the DealFlow extension icon in Chrome toolbar
2. Paste your auth token
3. Check "Auto-start on streams" (optional but recommended)
4. Click "Save Settings"

## How to Use

### Testing with YouTube (Recommended)
1. Go to any YouTube live stream with active chat
   - Example: Search "live auction" or "live shopping" on YouTube
   - Look for streams with "LIVE" badge and active chat
2. Click the DealFlow extension icon
3. Click "Start Monitoring"
4. Watch the extension detect messages in real-time!

### When Someone Says "I'll Take It!"
- You'll get a browser notification
- The sale will be auto-captured in your DealFlow dashboard
- You can see all captured sales at https://piqmyciivlcfxmcopeqk.lovable.app

### Supported Platforms
✅ YouTube Live Streams  
✅ TikTok LIVE  
✅ Whatnot Live Shopping  
✅ Facebook Live Videos  
✅ Instagram Live

### Common Purchase Phrases Detected
- "I'll take it"
- "Sold to me"
- "Mine!"
- "I'll buy it"
- "Put me down"
- "Dibs"
- And many more...

## Troubleshooting

### Extension Not Working?
1. Make sure you're on a live stream page with active chat
2. Check that your auth token is correct
3. Try refreshing the stream page
4. Check the Chrome DevTools console for errors

### Not Seeing Notifications?
1. Make sure Chrome notifications are enabled
2. Check that "Play notification sound" is checked in extension settings

### Token Expired?
If you get auth errors, get a fresh token:
1. Go to DealFlow app
2. Sign out and sign in again
3. Get new token from DevTools
4. Update in extension settings

## Support
For issues or questions, contact support or check the DealFlow dashboard.
