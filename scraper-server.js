// DealFlow - Whatnot Stream Scraper Server
// Run with: node scraper-server.js

const express = require('express');
const chromium = require('@sparticuz/chromium');
const puppeteerCore = require('puppeteer-core');
const cors = require('cors');

const router = express.Router();

// Buyer detection keywords - expanded for Whatnot sellers
const BUYER_KEYWORDS = [
  // Direct purchase
  'ill take it', "i'll take it", 'i take it', 'sold', 'mine', 'claiming', 'dibs',
  'i want it', 'i need it', 'need it', 'want it', 'want this', 'need this',
  
  // Action words
  'buying', 'grabbing', 'taking', 'getting', 'copping', 'snagging',
  'ill buy', "i'll buy", 'buy it', 'buying this', 'buying that',
  
  // Seller interaction
  'put me down', 'add me', 'me please', 'sold to me', 'for me',
  'gimme', 'give me', 'lemme get', 'let me get',
  
  // Confirmation
  'yes please', 'definitely', 'for sure', 'absolutely',
  'i claim', 'claim', 'claimed',
  
  // Size/variant requests (strong buy intent)
  'size', 'what size', 'any size', 'got size', 'have size',
  'color', 'which color', 'what color',
  
  // Payment/shipping (very strong buy intent)
  'how much', 'price', 'cost', 'pay', 'payment', 'ship', 'shipping',
  'send', 'invoice', 'paypal', 'venmo', 'cashapp',
  
  // Urgency
  'quick', 'hurry', 'fast', 'asap', 'now', 'right now'
];

function detectBuyer(message) {
  const lowerMessage = message.toLowerCase();
  return BUYER_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

router.post('/api/scrape-stream', async (req, res) => {
  const { url } = req.body;

  if (!url || !url.includes('whatnot.com')) {
    return res.status(400).json({ error: 'Invalid Whatnot URL' });
  }

  console.log('Scraping Whatnot stream:', url);

  let browser;
  try {
    // Launch browser (serverless-compatible)
    const isRender = process.env.RENDER === 'true' || process.env.RENDER_INTERNAL_HOSTNAME;
    if (isRender) {
      const executablePath = await chromium.executablePath();
      browser = await puppeteerCore.launch({
        executablePath,
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        headless: chromium.headless
      });
    } else {
      const puppeteer = require('puppeteer');
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('Navigating to stream...');
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    console.log('Waiting for chat to load...');
    await page.waitForTimeout(5000); // Wait for chat to render

    console.log('Extracting chat messages...');
    
    // Extract messages from the page
    const messages = await page.evaluate(() => {
      const results = [];
      
      // Look for chat messages - they appear in specific patterns on Whatnot
      // Chat messages typically have username followed by message text
      
      // Strategy 1: Find all text elements that look like chat messages
      const allElements = document.querySelectorAll('div, span, p');
      
      let lastUsername = null;
      
      allElements.forEach(el => {
        const text = el.innerText?.trim() || '';
        
        // Skip empty, very long, or system messages
        if (!text || text.length > 200 || text.includes('Welcome') || 
            text.includes('explicit content') || text.includes('Sign up') ||
            text.includes('Continue with') || text.includes('http')) {
          return;
        }
        
        // Check if this looks like a username (short, no spaces, possibly with @ or numbers)
        const looksLikeUsername = text.length < 30 && 
                                  (text.includes('@') || /^\w+\d+$/.test(text) || /^[a-z_]+\d*$/.test(text));
        
        if (looksLikeUsername && !lastUsername) {
          lastUsername = text;
        } else if (lastUsername && text !== lastUsername && text.length > 2) {
          // This might be a message following a username
          results.push({
            username: lastUsername,
            message: text
          });
          lastUsername = null;
        }
      });
      
      // Strategy 2: Look specifically in chat container areas
      const chatAreas = document.querySelectorAll('[class*="chat"], [class*="message"], [id*="chat"]');
      chatAreas.forEach(area => {
        const textNodes = area.querySelectorAll('div, span');
        let currentUser = null;
        
        textNodes.forEach(node => {
          const text = node.innerText?.trim();
          if (!text || text.length > 200) return;
          
          if (text.length < 30 && /^[@\w\d_]+$/.test(text)) {
            currentUser = text;
          } else if (currentUser && text.length > 2) {
            results.push({ username: currentUser, message: text });
            currentUser = null;
          }
        });
      });
      
      // Deduplicate
      const seen = new Set();
      return results.filter(msg => {
        const key = `${msg.username}:${msg.message}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });

    await browser.close();

    console.log(`Extracted ${messages.length} messages`);

    // Analyze messages for buyers
    const buyers = [];
    const allMessages = [];

    messages.forEach(msg => {
      const isBuyer = detectBuyer(msg.message);
      
      allMessages.push({
        username: msg.username,
        message: msg.message,
        isBuyer,
        timestamp: new Date().toISOString()
      });

      if (isBuyer) {
        buyers.push({
          username: msg.username,
          message: msg.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Calculate value estimation (rough)
    const estimatedValue = buyers.length * 50; // Assume $50 avg per sale

    const analysis = {
      totalMessages: allMessages.length,
      totalBuyers: buyers.length,
      estimatedValue,
      messages: allMessages,
      buyers,
      streamUrl: url,
      analyzedAt: new Date().toISOString()
    };

    console.log(`Analysis complete: ${buyers.length} buyers found, $${estimatedValue} estimated value`);

    res.json(analysis);

  } catch (error) {
    console.error('Scraping error:', error);
    
    if (browser) {
      await browser.close();
    }

    res.status(500).json({ 
      error: 'Failed to scrape stream',
      details: error.message 
    });
  }
});

module.exports = router;

