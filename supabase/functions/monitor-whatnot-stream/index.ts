import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { streamUrl, streamSessionId } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const isDemoMode = !streamSessionId

    // Browserless API key
    const browserlessKey = Deno.env.get('BROWSERLESS_API_KEY')
    
    if (!browserlessKey) {
      throw new Error('BROWSERLESS_API_KEY not configured')
    }
    
    console.log('Scraping Whatnot URL:', streamUrl)

    // Use Browserless /function endpoint with Puppeteer to execute JavaScript
    const scrapingCode = `
module.exports = async ({ page }) => {
  try {
    await page.goto('${streamUrl}', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait for chat to load
    await page.waitForTimeout(4000);
    
    // Extract messages from the DOM
    const messages = await page.evaluate(() => {
      const results = [];
      
      // Strategy 1: Look for .my-1 chat container
      const chatContainer = document.querySelector('.my-1');
      if (chatContainer) {
        const messageDivs = chatContainer.querySelectorAll('div[style*="margin-bottom"]');
        messageDivs.forEach(div => {
          const text = div.innerText || div.textContent;
          if (text && text.trim()) {
            const lines = text.split('\\n').filter(l => l.trim());
            if (lines.length > 0) {
              const username = lines[0].trim();
              const message = lines.slice(1).join(' ').trim() || lines[0];
              if (username.length > 0 && username.length < 50) {
                results.push({ username, message });
              }
            }
          }
        });
      }
      
      // Strategy 2: Look for common chat patterns if strategy 1 fails
      if (results.length === 0) {
        const allDivs = document.querySelectorAll('div');
        allDivs.forEach(div => {
          const style = div.getAttribute('style');
          if (style && style.includes('margin-bottom')) {
            const text = div.innerText;
            if (text && text.length > 2 && text.length < 200) {
              const lines = text.split('\\n').filter(l => l.trim());
              if (lines.length >= 1) {
                results.push({
                  username: lines[0].trim(),
                  message: lines.slice(1).join(' ').trim() || lines[0]
                });
              }
            }
          }
        });
      }
      
      return results;
    });
    
    return { messages, count: messages.length, success: true };
  } catch (error) {
    return { messages: [], count: 0, success: false, error: error.message };
  }
};
`;

    const browserlessResponse = await fetch(
      `https://production-sfo.browserless.io/function?token=${browserlessKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/javascript' },
        body: scrapingCode
      }
    )

    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text()
      console.error('Browserless error:', errorText)
      throw new Error(`Browserless failed: ${browserlessResponse.status}`)
    }

    const result = await browserlessResponse.json()
    console.log('Browserless result:', result)
    
    if (!result.success) {
      throw new Error(`Scraping failed: ${result.error}`)
    }

    const messages = result.messages || []
    console.log(`Extracted ${messages.length} messages`)

    // Analyze messages with AI for demo (or for real streams)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    const analyzedMessages = []
    
    if (LOVABLE_API_KEY && messages.length > 0) {
      console.log('Analyzing messages with AI...')
      
      for (const msg of messages) {
        try {
          const systemPrompt = `You are an AI analyzing live stream chat for valuable seller insights.

Classify messages into these categories:

BUYER: Direct purchase intent ("I'll take it", "sold", "mine", "dibs", "I want it")
QUESTION: Product questions ("what size?", "how much?", "condition?", "price?", "available?")
INTEREST: Interest signals ("love that", "so cool", "need this", "looks amazing", "want one")
PRICING: Pricing feedback ("too expensive", "great deal", "worth it", "overpriced", "cheap")
COMPETITOR: Mentions of other sellers/platforms/products
FEATURE: Feature requests or suggestions ("wish it had", "should be", "would buy if")
OTHER: General chat

Return is_buyer=true for BUYER, QUESTION, INTEREST, PRICING, COMPETITOR, or FEATURE categories (all valuable to sellers).`

          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-lite',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Analyze: "${msg.message}" from ${msg.username}` }
              ],
              tools: [{
                type: 'function',
                  function: {
                    name: 'classify_message',
                    parameters: {
                      type: 'object',
                      properties: {
                        is_buyer: { type: 'boolean' },
                        confidence: { type: 'number' },
                        type: { type: 'string', enum: ['buyer', 'question', 'interest', 'pricing', 'competitor', 'feature', 'other'] },
                        insight: { type: 'string', description: 'Brief seller insight from this message' }
                      },
                      required: ['is_buyer', 'confidence', 'type', 'insight'],
                      additionalProperties: false
                    }
                  }
              }],
              tool_choice: { type: 'function', function: { name: 'classify_message' } }
            })
          })

          if (aiResponse.ok) {
            const aiData = await aiResponse.json()
            const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
            if (toolCall) {
              const analysis = JSON.parse(toolCall.function.arguments)
              analyzedMessages.push({
                username: msg.username,
                message: msg.message,
                isBuyer: analysis.is_buyer,
                confidence: analysis.confidence,
                type: analysis.type,
                insight: analysis.insight || ''
              })
              console.log(`Analyzed: ${msg.username} - ${analysis.type} (${analysis.confidence}) - ${analysis.insight}`)
            }
          }
        } catch (error) {
          console.error('AI analysis error:', error)
          // Add message without analysis
          analyzedMessages.push({
            username: msg.username,
            message: msg.message,
            isBuyer: false,
            confidence: 0,
            type: 'other'
          })
        }
      }
    }

    // Store each message in database (skip if demo mode)
    if (!isDemoMode) {
      for (const msg of messages) {
        const { error: chatError } = await supabaseClient
          .from('chat_messages')
          .insert({
            stream_session_id: streamSessionId,
            username: msg.username,
            message: msg.message,
            platform: 'whatnot'
          })

        if (chatError) {
          console.error('Error saving chat message:', chatError)
        }
      }
    }

    // Calculate stats
    const buyers = analyzedMessages.filter(m => m.type === 'buyer' && m.confidence >= 0.7)
    const questions = analyzedMessages.filter(m => m.type === 'question' && m.confidence >= 0.7)
    const interests = analyzedMessages.filter(m => m.type === 'interest' && m.confidence >= 0.7)
    const pricing = analyzedMessages.filter(m => m.type === 'pricing' && m.confidence >= 0.7)
    const allInsights = analyzedMessages.filter(m => m.isBuyer && m.confidence >= 0.7)

    return new Response(
      JSON.stringify({ 
        success: true, 
        messagesFound: messages.length,
        messages: analyzedMessages,
        stats: {
          totalMessages: analyzedMessages.length,
          buyersDetected: buyers.length,
          questionsDetected: questions.length,
          interestDetected: interests.length,
          pricingFeedback: pricing.length,
          totalInsights: allInsights.length,
          insights: allInsights.map(m => ({
            username: m.username,
            type: m.type,
            insight: m.insight
          }))
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in monitor-whatnot-stream:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Function to extract messages from HTML
function extractChatMessages(html: string): Array<{username: string, message: string}> {
  const messages: Array<{username: string, message: string}> = []
  
  // Try multiple extraction strategies for Whatnot chat
  
  // Strategy 1: Look for data attributes that might contain chat data
  const dataAttrRegex = /data-[\w-]*chat[\w-]*="([^"]+)"|data-[\w-]*message[\w-]*="([^"]+)"/gi
  let match
  while ((match = dataAttrRegex.exec(html)) !== null) {
    const data = match[1] || match[2]
    if (data && data.length > 3 && data.length < 300) {
      console.log('Found data attribute:', data)
    }
  }
  
  // Strategy 2: Look for JSON embedded in script tags
  const scriptRegex = /<script[^>]*>([^<]+)<\/script>/gi
  while ((match = scriptRegex.exec(html)) !== null) {
    const scriptContent = match[1]
    if (scriptContent.includes('chat') || scriptContent.includes('message')) {
      // Try to find JSON structures
      const jsonMatch = scriptContent.match(/\{[^{}]*"(?:message|text|content|body)"[^{}]*\}/g)
      if (jsonMatch) {
        console.log('Found potential chat JSON in script')
      }
    }
  }
  
  // Strategy 3: Extract all text content from divs and spans
  const allTextRegex = /<(?:div|span|p)[^>]*class="[^"]*(?:chat|message|comment)[^"]*"[^>]*>([^<]+)<\/(?:div|span|p)>/gi
  const allTexts: string[] = []
  
  while ((match = allTextRegex.exec(html)) !== null) {
    const text = match[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .trim()
    
    if (text && text.length > 0 && text.length < 300) {
      allTexts.push(text)
    }
  }
  
  // Fallback: Extract ALL text in divs/spans
  if (allTexts.length === 0) {
    const fallbackRegex = /<(?:div|span|p)[^>]*>([^<]+)<\/(?:div|span|p)>/gi
    while ((match = fallbackRegex.exec(html)) !== null) {
      const text = match[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .trim()
      
      if (text && text.length > 2 && text.length < 300 && 
          !text.includes('<!DOCTYPE') && 
          !text.includes('http') &&
          !text.includes('Cloudflare')) {
        allTexts.push(text)
      }
    }
  }
  
  console.log(`Extracted ${allTexts.length} text segments from HTML`)
  
  // Pair usernames with messages
  for (let i = 0; i < allTexts.length - 1; i++) {
    const text1 = allTexts[i].trim()
    const text2 = allTexts[i + 1].trim()
    
    // Username pattern: short text followed by longer message
    if (text1.length > 1 && text1.length < 25 && 
        text2.length > 2 && text2.length < 300 &&
        !text1.includes('Follow') && 
        !text1.includes('Sign') &&
        !text1.includes('Watch') &&
        !text2.includes('Follow') &&
        !text2.includes('Loading')) {
      
      messages.push({ 
        username: text1, 
        message: text2 
      })
    }
  }
  
  console.log(`Extracted ${messages.length} messages from patterns`)
  
  return messages
}