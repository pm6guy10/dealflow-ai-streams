// DealFlow - AI-Powered Stream Analysis API
// Combines Puppeteer scraping + Claude AI intent detection + message drafting

const express = require('express');
const chromium = require('@sparticuz/chromium');
const puppeteerCore = require('puppeteer-core');
const { analyzeStreamForIntents } = require('./lib/ai');

const router = express.Router();

router.post('/api/analyze-stream', async (req, res) => {
  const { url, sellerName, category } = req.body;

  if (!url || !url.includes('whatnot.com')) {
    return res.status(400).json({ error: 'Invalid Whatnot URL' });
  }

  console.log('🚀 Starting AI-powered stream analysis:', url);

  let browser;
  try {
    // Step 1: Scrape the stream
    console.log('📹 Scraping stream...');
    
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
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    console.log('⏳ Waiting for chat to load...');
    await page.waitForTimeout(5000);

    console.log('💬 Extracting chat messages...');
    const messages = await page.evaluate(() => {
      const results = [];
      const allElements = document.querySelectorAll('div, span, p');
      let lastUsername = null;
      
      allElements.forEach(el => {
        const text = el.innerText?.trim() || '';
        
        if (!text || text.length > 200 || text.includes('Welcome') || 
            text.includes('explicit content') || text.includes('Sign up') ||
            text.includes('Continue with') || text.includes('http')) {
          return;
        }
        
        const looksLikeUsername = text.length < 30 && 
                                  (text.includes('@') || /^\w+\d+$/.test(text) || /^[a-z_]+\d*$/.test(text));
        
        if (looksLikeUsername && !lastUsername) {
          lastUsername = text;
        } else if (lastUsername && text !== lastUsername && text.length > 2) {
          results.push({
            username: lastUsername.replace('@', ''),
            message: text,
            timestamp: new Date().toISOString()
          });
          lastUsername = null;
        }
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
    console.log(`✅ Extracted ${messages.length} messages`);

    // Step 2: AI Analysis
    console.log('🤖 Running AI intent detection + message drafting...');
    
    const intents = await analyzeStreamForIntents(messages, {
      sellerName: sellerName || 'there',
      category: category || 'items',
      streamUrl: url
    });

    console.log(`✨ Found ${intents.length} buyers with drafted messages`);

    // Step 3: Calculate stats
    const estimatedValue = intents.length * 50; // $50 avg per sale

    const response = {
      success: true,
      totalMessages: messages.length,
      totalIntents: intents.length,
      estimatedValue,
      intents, // Array of {username, timestamp, original_comment, item_wanted, details, drafted_message, status}
      streamUrl: url,
      analyzedAt: new Date().toISOString(),
      magicMoment: `You had ${intents.length} buying intents you might have missed. Here are personalized messages - just click APPROVE! 🎯`
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Analysis error:', error);
    
    if (browser) {
      await browser.close();
    }

    res.status(500).json({ 
      error: 'Failed to analyze stream',
      details: error.message 
    });
  }
});

module.exports = router;

