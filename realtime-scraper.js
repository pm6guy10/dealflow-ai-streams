// DealFlow - Enhanced Puppeteer Monitor (v1.5 - Reality-Checked)
// Auto-rotates, dedupes, and filters without breaking existing flows

const http = require('http');
const express = require('express');
const chromium = require('@sparticuz/chromium');
const puppeteerCore = require('puppeteer-core');
const cors = require('cors');
const WebSocket = require('ws');
const LRU = require('lru-cache');
const storage = require('./lib/storage');

const app = express();

// CORS configuration for Vercel frontend
app.use(cors({
  origin: [
    'https://dealflow-ai-streams-o7rv4bdax-brandons-projects-5552f226.vercel.app',
    'https://dealflow-ai-streams-84o9ikfok-brandons-projects-5552f226.vercel.app',
    'https://dealflow-ai-streams-k5rczzvpp-brandons-projects-5552f226.vercel.app',
    'https://dealflow-ai-streams.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Mount AI analysis endpoint
const analyzeStreamRouter = require('./api-analyze-stream');
app.use(analyzeStreamRouter);

const PORT = process.env.PORT || 3001;
const WHATNOT_BASE_URL = 'https://www.whatnot.com';

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
let activeMonitors = new Map();

async function launchBrowser() {
  const chromeExecPathFromEnv = process.env.CHROME_EXECUTABLE_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  const isRender = process.env.RENDER === 'true' || process.env.RENDER_INTERNAL_HOSTNAME;

  const launchWithChromium = async () => {
    const executablePath = chromeExecPathFromEnv || (await chromium.executablePath());
    if (!executablePath) {
      throw new Error('Chromium executable path not found');
    }

    return puppeteerCore.launch({
      executablePath,
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: chromium.defaultViewport,
      headless: chromium.headless !== undefined ? chromium.headless : 'new',
      ignoreHTTPSErrors: true
    });
  };

  try {
    return await launchWithChromium();
  } catch (err) {
    console.warn('⚠️ Failed to launch chromium bundle:', err.message);
    if (isRender) {
      throw err;
    }

    console.warn('⚠️ Falling back to full puppeteer (local dev)');
    const puppeteer = require('puppeteer');
    return puppeteer.launch({
      headless: process.env.HEADLESS === 'false' ? false : 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
}

// Buyer detection keywords (unchanged for parity with existing UI expectations)
const BUYER_KEYWORDS = [
  'ill take it', "i'll take it", 'i take it', 'claiming', 'claimed', 'claim it',
  'sold', 'mine', 'dibs', 'sold to me',
  'i want it', 'i need it', 'need that', 'want that',
  'buying', 'grabbing', 'taking', 'copping',
  'put me down', 'add me', 'me please',
  'what size do you have', 'got size', 'have size', 'any size',
  'size 1', 'size 2', 'size 3', 'size 4', 'size 5',
  'size 6', 'size 7', 'size 8', 'size 9', 'size 10',
  'size 11', 'size 12', 'size 13', 'size 14',
  'how much', 'whats the price', "what's the price", 'price on',
  'how do i pay', 'send invoice', 'paypal', 'venmo', 'cashapp',
  'ready to buy', 'ready to purchase'
];

function detectBuyer(message) {
  const lowerMessage = message.toLowerCase();

  if (message.split(' ').length < 2) {
    return { isBuyer: false, confidence: 0 };
  }

  const highConfidence = ['claiming', 'claimed', 'ill take it', "i'll take it", 'sold to me', 'dibs'];
  for (const keyword of highConfidence) {
    if (lowerMessage.includes(keyword)) {
      return { isBuyer: true, confidence: 0.95, reason: keyword };
    }
  }

  if (lowerMessage.match(/size\s+(1[0-4]|[1-9])/)) {
    return { isBuyer: true, confidence: 0.8, reason: 'size request' };
  }

  for (const keyword of BUYER_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      return { isBuyer: true, confidence: 0.7, reason: keyword };
    }
  }

  return { isBuyer: false, confidence: 0 };
}

function broadcastToClients(payload) {
  const stringified = JSON.stringify(payload);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(stringified);
    }
  });
}

async function discoverTopStreams(browser, limit = 10) {
  let discoveryPage;
  try {
    discoveryPage = await browser.newPage();
    await discoveryPage.setViewport({ width: 1366, height: 768 });
    await discoveryPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await discoveryPage.goto(WHATNOT_BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });
    await discoveryPage.waitForTimeout(2500);

    const topStreams = await discoveryPage.evaluate((limit) => {
      const anchors = Array.from(document.querySelectorAll('a[href^="/live/"]'));
      const seen = new Set();
      const candidates = [];

      function parseViewers(text) {
        if (!text) return 0;
        const normalized = text.replace(/[\,\s]/g, '').toLowerCase();
        const match = normalized.match(/(\d+(?:\.\d+)?)([km]?)/);
        if (!match) return 0;
        let value = parseFloat(match[1]);
        if (match[2] === 'k') value *= 1000;
        if (match[2] === 'm') value *= 1_000_000;
        return Math.round(value);
      }

      for (const anchor of anchors) {
        const href = anchor.getAttribute('href');
        if (!href || seen.has(href)) continue;
        seen.add(href);

        let viewers = 0;
        const viewerEl = anchor.querySelector('[data-testid*="viewer"], [aria-label*="viewer"], [class*="viewer"]');
        if (viewerEl) viewers = parseViewers(viewerEl.textContent || '');

        const titleEl = anchor.querySelector('h2, h3, span');
        const title = titleEl ? titleEl.textContent.trim() : '';

        candidates.push({ href, viewers, title });
        if (candidates.length >= limit * 2) break;
      }

      candidates.sort((a, b) => b.viewers - a.viewers);
      return candidates.slice(0, limit).map(candidate => ({
        url: new URL(candidate.href, location.origin).toString(),
        title: candidate.title,
        viewers: candidate.viewers
      }));
    }, limit);

    return Array.isArray(topStreams) ? topStreams : [];
  } catch (error) {
    console.warn('⚠️ Unable to discover top streams:', error.message);
    return [];
  } finally {
    if (discoveryPage) {
      await discoveryPage.close().catch(() => {});
    }
  }
}

async function navigateToAvailableStream(page, candidates) {
  for (const candidate of candidates) {
    for (let retry = 0; retry < 3; retry++) {
      try {
        const targetUrl = typeof candidate === 'string' ? candidate : candidate.url;
        console.log(`📡 Attempting ${targetUrl} (retry ${retry + 1})`);
        await page.goto(targetUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 45000
        });
        await page.waitForSelector('body', { timeout: 15000 });
        await page.waitForTimeout(2000);
        console.log('✅ Connected to stream:', targetUrl);
        return {
          url: targetUrl,
          title: (candidate && candidate.title) || null,
          viewers: (candidate && candidate.viewers) || null,
          source: (candidate && candidate.source) || null
        };
      } catch (error) {
        console.warn(`⚠️ Retry failed: ${error.message}`);
      }
    }
  }

  throw new Error('Unable to connect to any stream candidate');
}

app.post('/api/start-monitoring', async (req, res) => {
  const { url, sessionId, autoDiscover = false, fallbackUrls = [] } = req.body;

  if (!autoDiscover && (!url || !url.includes('whatnot.com'))) {
    return res.status(400).json({ error: 'Invalid Whatnot URL' });
  }

  if (activeMonitors.has(sessionId)) {
    console.log('⚠️ Session already exists, stopping old one first...');
    const oldMonitor = activeMonitors.get(sessionId);
    clearInterval(oldMonitor.interval);
    try {
      await oldMonitor.browser.close();
    } catch (e) {
      console.log('Old browser already closed');
    }
    activeMonitors.delete(sessionId);
  }

  console.log('🚀 Starting real-time monitoring for:', autoDiscover ? '[auto-discovery]' : url);

  // Create stream session in storage
  let streamSession = null;
  try {
    streamSession = await storage.createStream(url || 'auto-discovery');
    console.log('✅ Created stream session:', streamSession.id);
  } catch (err) {
    console.error('❌ Failed to create stream session:', err);
  }

  const browser = await launchBrowser();

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  await page.setJavaScriptEnabled(true);
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const type = request.resourceType();
    if (['image', 'font', 'media', 'stylesheet'].includes(type)) {
      request.abort();
    } else {
      request.continue();
    }
  });

  let streamInfo = {
    url: url || null,
    title: null,
    viewers: null,
    source: autoDiscover ? 'auto' : 'manual'
  };
  let lastActivity = Date.now();

  try {
    const candidateObjects = [];

    if (autoDiscover) {
      const discovered = await discoverTopStreams(browser, 10);
      discovered.forEach(item => candidateObjects.push({ ...item, source: 'auto' }));
    }

    const manualCandidates = [];
    if (url) {
      manualCandidates.push({ url, title: null, source: autoDiscover ? 'requested' : 'manual' });
    }

    (fallbackUrls || []).forEach(fallbackUrl => {
      if (fallbackUrl && typeof fallbackUrl === 'string') {
        manualCandidates.push({ url: fallbackUrl, title: null, source: 'fallback' });
      }
    });

    const unique = [];
    const seenUrls = new Set();
    [...candidateObjects, ...manualCandidates].forEach(candidate => {
      if (!candidate.url || seenUrls.has(candidate.url)) return;
      seenUrls.add(candidate.url);
      unique.push(candidate);
    });

    if (unique.length === 0) {
      throw new Error('No stream candidates available');
    }

    console.log('🔎 Stream candidates:', unique.map(c => `${c.url} (${c.source || 'unknown'})`));
    streamInfo = await navigateToAvailableStream(page, unique);
    streamInfo.source = streamInfo.source || (autoDiscover ? 'auto' : 'manual');

    broadcastToClients({
      type: 'stream_selected',
      sessionId,
      stream: streamInfo
    });

    console.log('🎯 Monitoring stream:', streamInfo);
  } catch (navigationError) {
    await browser.close();
    console.error('❌ Failed to connect to stream:', navigationError.message);
    return res.status(500).json({ error: navigationError.message });
  }

  if (process.env.DEALFLOW_SAVE_SCREENSHOT === 'true') {
    try {
      await page.screenshot({ path: `debug-screenshot-${Date.now()}.png`, fullPage: true });
      console.log('📸 Screenshot saved for debugging');
    } catch (screenshotError) {
      console.warn('⚠️ Unable to capture screenshot:', screenshotError.message);
    }
  }

  const seenMessages = new LRU({ max: 10000, ttl: 1000 * 60 * 5 });
  let buyerCount = 0;
  let totalMessages = 0;

  const monitor = {
    browser,
    page,
    ready: false,
    stream: streamInfo,
    interval: setInterval(async () => {
      if (!monitor.ready) {
        return;
      }
      try {
        console.log('🔍 Checking for new messages...');

        const messages = await page.evaluate(() => {
          const results = [];

          let chatContainer = null;

          const chatTab = Array.from(document.querySelectorAll('*')).find(el =>
            el.textContent === 'Chat' || el.textContent?.includes('Chat')
          );

          if (chatTab) {
            let parent = chatTab.closest('[style*="overflow"]');
            if (parent) {
              chatContainer = parent;
            } else {
              parent = chatTab.parentElement;
              for (let i = 0; i < 5 && parent; i++) {
                const scrollable = Array.from(parent.querySelectorAll('*')).find(el =>
                  el.scrollHeight > el.clientHeight && el.style.overflow !== 'visible'
                );
                if (scrollable) {
                  chatContainer = scrollable;
                  break;
                }
                parent = parent.parentElement;
              }
            }
          }

          if (!chatContainer) {
            const allElements = Array.from(document.querySelectorAll('*'));
            const rightSideElements = allElements.filter(el => {
              const rect = el.getBoundingClientRect();
              return rect.left > window.innerWidth * 0.6 &&
                     rect.width < window.innerWidth * 0.4 &&
                     rect.height > 300;
            });

            chatContainer = rightSideElements.find(el =>
              el.scrollHeight > el.clientHeight ||
              el.children.length > 10
            );
          }

          if (!chatContainer) {
            const potentialChats = Array.from(document.querySelectorAll('[class*="chat"], [class*="message"], [class*="comment"]'));
            chatContainer = potentialChats.find(el => {
              const rect = el.getBoundingClientRect();
              return rect.height > 400 && rect.width > 200;
            });
          }

          if (!chatContainer) {
            return results;
          }

          const allElements = chatContainer.querySelectorAll('*');

          const messageContainers = Array.from(allElements).filter(el => {
            const rect = el.getBoundingClientRect();
            const text = el.innerText?.trim() || '';

            if (!el.offsetParent || rect.width < 100 || rect.height < 20) return false;
            if (text.length < 3 || text.length > 200) return false;

            const hasUsername = /\w+/.test(text) && text.length < 50;
            const hasMessage = text.split('\n').length <= 3;

            return hasUsername && hasMessage;
          });

          messageContainers.forEach(container => {
            const fullText = container.innerText?.trim();
            if (!fullText || fullText.length > 200 || fullText.length < 3) return;

            if (fullText.includes('FOLLOWERS') || fullText.includes('JOIN NOW') ||
                fullText.includes('RESTOCK') || fullText.includes('BEST PRICE') ||
                /\d+K FOLLOWERS/i.test(fullText) || fullText.match(/^[A-Z\s🔥]{10,}$/) ||
                fullText.includes('Welcome') || fullText.includes('explicit content') ||
                fullText.includes('Sign up') || fullText.includes('Continue with') ||
                fullText.includes('http') || fullText.includes('Terms') ||
                fullText.includes('Follow Host') || fullText.includes('Say something') ||
                fullText.includes('Host') || fullText.includes('Moderator') ||
                fullText.includes('Bidding') ||
                /^\w+\s*$/.test(fullText) || fullText.match(/^[a-z]+\d+$/i)) {
              return;
            }

            const lines = fullText.split('\n').map(l => l.trim()).filter(l => l);

            let username = '';
            let message = '';

            if (lines.length >= 2) {
              username = lines[0].replace(/[^\w\d_]/g, '');
              message = lines.slice(1).join(' ');
            } else if (lines.length === 1) {
              const parts = lines[0].split(/[:]\s*/);
              if (parts.length >= 2) {
                username = parts[0].replace(/[^\w\d_]/g, '');
                message = parts.slice(1).join(':');
              } else {
                const words = lines[0].split(/\s+/);
                if (words.length >= 2) {
                  username = words[0].replace(/[^\w\d_]/g, '');
                  message = words.slice(1).join(' ');
                }
              }
            }

            if (!username || username.length < 2 || username.length > 20) return;
            if (!message || message.length < 2 || message.length > 150) return;

            results.push({ username, message });
          });

          const seen = new Set();
          return results.filter(msg => {
            const key = `${msg.username}|${msg.message}`;
            if (seen.has(key) || !msg.username || !msg.message) return false;
            seen.add(key);
            return true;
          });
        });

        const newMessages = messages.filter(msg => {
          const key = `${msg.username}:${msg.message}`;
          if (seenMessages.has(key)) return false;
          seenMessages.set(key, Date.now());
          return true;
        });

        if (newMessages.length > 0) {
          console.log(`📬 Found ${newMessages.length} new messages (Total: ${totalMessages + newMessages.length})`);
          lastActivity = Date.now();
          totalMessages += newMessages.length;

          for (const msg of newMessages) {
            // Log every comment for debugging
            console.log(`💬 Comment: @${msg.username} said "${msg.message}"`);
            
            const detection = detectBuyer(msg.message);
            const isQuestion = msg.message.includes('?');
            if (detection.isBuyer && isQuestion) {
              detection.confidence = Math.min(1, detection.confidence + 0.1);
            }

            if (detection.isBuyer) {
              buyerCount++;

              const buyerData = {
                username: msg.username,
                message: msg.message,
                confidence: detection.confidence,
                reason: detection.reason,
                timestamp: new Date().toISOString(),
                buyerNumber: buyerCount
              };

              const buyerAlert = {
                type: 'buyer_detected',
                sessionId,
                buyer: buyerData,
                stats: {
                  totalBuyers: buyerCount,
                  totalMessages,
                  estimatedValue: buyerCount * 50
                }
              };

              console.log(`🔥 BUYER INTENT DETECTED: @${msg.username} - "${msg.message}" | Confidence: ${Math.round(detection.confidence * 100)}% | Reason: ${detection.reason}`);
              
              // Save buyer intent to storage
              const monitor = activeMonitors.get(sessionId);
              if (monitor && monitor.streamId) {
                storage.saveBuyerIntent(monitor.streamId, buyerData)
                  .then(() => console.log('✅ Saved buyer intent to storage'))
                  .catch(err => console.error('❌ Failed to save buyer intent:', err));
              }
              
              broadcastToClients(buyerAlert);
            }

            const messageUpdate = {
              type: 'new_message',
              sessionId,
              message: {
                username: msg.username,
                message: msg.message,
                timestamp: new Date().toISOString(),
                isBuyer: detection.isBuyer,
                confidence: detection.confidence,
                isQuestion
              }
            };

            broadcastToClients(messageUpdate);
          }
          
          // Broadcast debug stats every batch
          const debugStats = {
            type: 'debug_stats',
            sessionId,
            stats: {
              totalMessages,
              buyerCount,
              lastScrape: new Date().toISOString(),
              messagesPerMinute: Math.round((totalMessages / ((Date.now() - Date.now()) / 60000)) || 0)
            }
          };
          broadcastToClients(debugStats);
        } else {
          // Log when no messages found
          console.log('🔍 Scraping... (no new messages)');
        }

        if (Date.now() - lastActivity > 30000 && autoDiscover) {
          console.log('Stream quiet - rotating...');
          const newCandidates = await discoverTopStreams(browser);
          const rotationCandidates = newCandidates.filter(c => c.url !== streamInfo.url);
          if (rotationCandidates.length > 0) {
            const newStream = await navigateToAvailableStream(page, rotationCandidates.slice(0, 3));
            if (newStream) {
              streamInfo = newStream;
              broadcastToClients({ type: 'stream_selected', sessionId, stream: streamInfo });
              lastActivity = Date.now();
              console.log('🔄 Rotated to:', streamInfo.url);
            }
          }
        }

      } catch (error) {
        console.error('❌ Monitoring error:', error.message);
      }
    }, 1500)
  };

  // Add streamId to monitor
  monitor.streamId = streamSession ? streamSession.id : null;
  
  activeMonitors.set(sessionId, monitor);

  res.json({
    status: 'monitoring',
    sessionId,
    streamId: monitor.streamId,
    stream: streamInfo,
    message: 'Real-time monitoring started. Connect to WebSocket for live updates.'
  });

  monitor.ready = true;
});

// Get stream summary (for post-stream review)
app.get('/api/stream-summary/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const summary = await storage.getStreamSummary(streamId);
    
    if (!summary) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    res.json(summary);
  } catch (error) {
    console.error('Failed to get stream summary:', error);
    res.status(500).json({ error: 'Failed to retrieve stream summary' });
  }
});

// Get all streams (for dashboard)
app.get('/api/streams', async (req, res) => {
  try {
    const streams = await storage.getAllStreams();
    res.json({ streams });
  } catch (error) {
    console.error('Failed to get streams:', error);
    res.status(500).json({ error: 'Failed to retrieve streams' });
  }
});

app.post('/api/stop-monitoring', async (req, res) => {
  const { sessionId } = req.body;

  if (!activeMonitors.has(sessionId)) {
    return res.status(404).json({ error: 'No active monitoring session' });
  }

  const monitor = activeMonitors.get(sessionId);
  
  // End stream session in storage
  if (monitor.streamId) {
    try {
      await storage.endStream(monitor.streamId);
      console.log('✅ Ended stream session:', monitor.streamId);
    } catch (err) {
      console.error('❌ Failed to end stream session:', err);
    }
  }
  
  clearInterval(monitor.interval);
  await monitor.browser.close();
  activeMonitors.delete(sessionId);

  console.log('🛑 Stopped monitoring session:', sessionId);

  res.json({ 
    status: 'stopped', 
    sessionId,
    streamId: monitor.streamId 
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DealFlow Real-Time Monitor',
    activeSessions: activeMonitors.size
  });
});

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📩 WebSocket message received:', data);
      
      if (data.action === 'monitor') {
        // Generate a session ID
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Start monitoring via HTTP endpoint logic
        const monitoringRequest = {
          body: {
            url: data.url,
            sessionId: sessionId,
            autoDiscover: false
          }
        };
        
        // Create a mock response that will send via WebSocket
        const monitoringResponse = {
          json: (responseData) => {
            console.log('✅ Monitoring started:', responseData);
            ws.send(JSON.stringify({
              type: 'monitoring_started',
              ...responseData
            }));
          },
          status: (code) => ({
            json: (errorData) => {
              console.error('❌ Monitoring failed:', errorData);
              ws.send(JSON.stringify({
                type: 'error',
                error: errorData.error
              }));
            }
          })
        };
        
        // Call the monitoring logic manually
        const { url } = monitoringRequest.body;
        
        if (!url || !url.includes('whatnot.com')) {
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Invalid Whatnot URL'
          }));
          return;
        }
        
        if (activeMonitors.has(sessionId)) {
          const oldMonitor = activeMonitors.get(sessionId);
          clearInterval(oldMonitor.interval);
          try {
            await oldMonitor.browser.close();
          } catch (e) {
            console.log('Old browser already closed');
          }
          activeMonitors.delete(sessionId);
        }
        
        console.log('🚀 Starting real-time monitoring for:', url);
        
        // Create stream session
        let streamSession = null;
        try {
          streamSession = await storage.createStream(url);
          console.log('✅ Created stream session:', streamSession.id);
        } catch (err) {
          console.error('❌ Failed to create stream session:', err);
        }
        
        const browser = await launchBrowser();
        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        await page.setJavaScriptEnabled(true);
        await page.setRequestInterception(true);
        page.on('request', (request) => {
          const type = request.resourceType();
          if (['image', 'font', 'media', 'stylesheet'].includes(type)) {
            request.abort();
          } else {
            request.continue();
          }
        });
        
        let streamInfo = { url, title: null, viewers: null, source: 'manual' };
        
        try {
          const succeeded = await navigateToAvailableStream(page, [{ url, source: 'manual' }], streamInfo);
          
          if (!succeeded) {
            await browser.close();
            ws.send(JSON.stringify({
              type: 'error',
              error: 'Could not load any streams'
            }));
            return;
          }
        } catch (err) {
          console.error('❌ Failed to navigate:', err);
          await browser.close();
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Failed to load stream'
          }));
          return;
        }
        
        const messageCache = new LRU({ max: 500 });
        let totalMessages = 0;
        let buyerCount = 0;
        
        const monitor = {
          browser,
          page,
          interval: null,
          sessionId,
          streamId: streamSession ? streamSession.id : null,
          ready: false
        };
        
        // Monitoring interval
        monitor.interval = setInterval(async () => {
          try {
            const newMessages = await scrapeMessages(page, messageCache);
            totalMessages += newMessages.length;
            
            if (newMessages.length > 0) {
              console.log(`📬 Found ${newMessages.length} new messages (Total: ${totalMessages})`);
              
              const buyerAlerts = [];
              
              for (const msg of newMessages) {
                console.log(`💬 Comment: @${msg.username} said "${msg.message}"`);
                
                const detection = detectBuyer(msg.message);
                
                if (detection.isBuyer) {
                  buyerCount++;
                  console.log(`🔥 BUYER INTENT DETECTED: @${msg.username} - "${msg.message}" | Confidence: ${Math.round(detection.confidence * 100)}% | Reason: ${detection.reason}`);
                  
                  const buyerData = {
                    username: msg.username,
                    comment: msg.message,
                    timestamp: new Date().toISOString(),
                    confidence: detection.confidence,
                    reason: detection.reason
                  };
                  
                  if (monitor.streamId) {
                    storage.saveBuyerIntent(monitor.streamId, buyerData)
                      .then(() => console.log('✅ Saved buyer intent to storage'))
                      .catch(err => console.error('❌ Failed to save buyer intent:', err));
                  }
                  
                  buyerAlerts.push(buyerData);
                }
              }
              
              // Broadcast to all connected WebSocket clients
              wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'new_messages',
                    sessionId: monitor.sessionId,
                    messages: newMessages,
                    buyers: buyerAlerts,
                    stats: {
                      totalMessages,
                      buyerCount
                    }
                  }));
                }
              });
              
              // Send debug stats
              wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'debug_stats',
                    sessionId: monitor.sessionId,
                    stats: {
                      totalMessages,
                      buyerCount,
                      lastScrape: new Date().toISOString(),
                      messagesPerMinute: Math.round((totalMessages / ((Date.now() - Date.now()) / 60000)) || 0)
                    }
                  }));
                }
              });
            } else {
              console.log('🔍 Scraping... (no new messages)');
            }
          } catch (err) {
            console.error('❌ Monitoring error:', err);
          }
        }, 1500);
        
        activeMonitors.set(sessionId, monitor);
        monitor.ready = true;
        
        ws.send(JSON.stringify({
          type: 'monitoring_started',
          status: 'monitoring',
          sessionId,
          streamId: monitor.streamId,
          stream: streamInfo,
          message: 'Real-time monitoring started'
        }));
      }
    } catch (err) {
      console.error('❌ WebSocket message error:', err);
      ws.send(JSON.stringify({
        type: 'error',
        error: err.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
  });
});

// Import and mount the post-stream scraper endpoint
const scraperEndpoint = require('./scraper-server.js');
app.use(scraperEndpoint);

server.listen(PORT, () => {
  console.log(`🚀 DealFlow running on port ${PORT}`);
});

