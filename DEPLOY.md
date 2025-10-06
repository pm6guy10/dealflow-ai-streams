# 🚀 Deploy DealFlow Demo Killer

This setup uses two pieces:
- **DealFlow Monitor** (Puppeteer scraper + WebSocket) → hosted on Render (persistent Node server)
- **DealFlow Demo UI** (static HTML) → hosted on Vercel, configured to hit the Render API

---

## 1. Deploy the Monitor to Render (10 minutes)

1. Create a free Render account: https://render.com
2. Click **New + → Web Service** and connect this repo (or upload as a private service).
3. Configure the service:
   - **Environment:** Node
   - **Region:** US (cheapest for Whatnot)
   - **Branch:** main (or current branch)
   - **Build Command:** `npm install`
   - **Start Command:** `node realtime-scraper.js`
   - **Instance Type:** Starter (free tier works)
4. Set environment variables:
   - `PORT=10000` (Render default)
5. Deploy; wait until the service is live. You’ll get a URL like `https://dealflow-monitor.onrender.com`.
6. Keep the Render dashboard open; the logs will show stream activity.

---

## 2. Configure the Frontend (Vercel)

1. In `public/` (root) files, the scraper URL is read from `window.DEALFLOW_API_BASE`.
2. Set this globally in Vercel:
   - In the Vercel dashboard → Project → **Settings → Environment Variables**
   - Add `NEXT_PUBLIC_DEALFLOW_API_BASE` (or custom script) pointing to your Render URL, e.g. `https://dealflow-monitor.onrender.com`
   - Alternatively, edit `index.html` / `dealflow-demo-killer.html` to include `<script>window.DEALFLOW_API_BASE='https://dealflow-monitor.onrender.com';</script>` before other scripts.
3. Redeploy via CLI:
   ```bash
   npm install
   vercel --prod
   ```
4. Visit the Vercel URL; the page should show the auto-discovered stream, live chat, and buyer queue.

---

## 3. Optional: Deploy the monitoring UI (`dealflow-realtime.html`)

1. The same API base applies. Ensure the HTML includes:
   ```html
   <script>
     window.DEALFLOW_API_BASE = 'https://dealflow-monitor.onrender.com';
   </script>
   ```
2. The page will then hit Render for `start-monitoring` / `stop-monitoring` and WebSocket.

---

## What You Get
- **Top-stream auto mirror** (no more static demo)
- **Real buyer detection** with CSV export
- **Single render service + static frontend** → shareable “holy crap” experience

Need help automating the Render deploy or wiring secrets? Ping me. 

