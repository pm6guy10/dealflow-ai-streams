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
    
    console.log('Scraping Whatnot URL:', streamUrl)

    // Use Browserless to scrape the chat
    const browserlessResponse = await fetch(
      `https://production-sfo.browserless.io/content?token=${browserlessKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: streamUrl,
          gotoOptions: {
            waitUntil: 'networkidle2'
          }
        })
      }
    )

    if (!browserlessResponse.ok) {
      throw new Error(`Browserless failed: ${browserlessResponse.statusText}`)
    }

    const html = await browserlessResponse.text()
    console.log('Received HTML length:', html.length)

    // Parse HTML to extract chat messages
    const messages = extractChatMessages(html)
    console.log(`Extracted ${messages.length} messages`)

    // Analyze messages with AI for demo (or for real streams)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    const analyzedMessages = []
    
    if (LOVABLE_API_KEY && messages.length > 0) {
      console.log('Analyzing messages with AI...')
      
      for (const msg of messages) {
        try {
          const systemPrompt = `You are an AI that analyzes live stream chat messages to detect purchase intent.

Common purchase phrases: "I'll take it", "I'll buy it", "Sold to me", "Mine!", "I want it", "Gimme", "Dibs"
Questions are: "How much?", "What size?", "Still available?"

Classify each message as either a BUYER (purchase intent) or QUESTION (asking about the item).`

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
                      type: { type: 'string', enum: ['buyer', 'question', 'other'] }
                    },
                    required: ['is_buyer', 'confidence', 'type'],
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
                type: analysis.type
              })
              console.log(`Analyzed: ${msg.username} - ${analysis.type} (${analysis.confidence})`)
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
    const buyers = analyzedMessages.filter(m => m.isBuyer && m.confidence >= 0.7)
    const questions = analyzedMessages.filter(m => m.type === 'question')

    return new Response(
      JSON.stringify({ 
        success: true, 
        messagesFound: messages.length,
        messages: analyzedMessages,
        stats: {
          totalMessages: analyzedMessages.length,
          buyersDetected: buyers.length,
          questionsDetected: questions.length,
          buyers: buyers.map(b => b.username)
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
  
  // Whatnot chat has usernames and messages in specific div structures
  // Look for common patterns in chat messages
  
  // Extract all text content from divs and spans
  const allTextRegex = /<(?:div|span)[^>]*>([^<]+)<\/(?:div|span)>/gi
  let match
  const allTexts: string[] = []
  
  while ((match = allTextRegex.exec(html)) !== null) {
    const text = match[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .trim()
    
    if (text && text.length > 0 && text.length < 200) {
      allTexts.push(text)
    }
  }
  
  console.log(`Extracted ${allTexts.length} text segments from HTML`)
  
  // Look for username patterns - usernames in Whatnot often appear before messages
  // A username is typically short (under 30 chars) and followed by a longer message
  for (let i = 0; i < allTexts.length - 1; i++) {
    const text1 = allTexts[i].trim()
    const text2 = allTexts[i + 1].trim()
    
    // Check if text1 looks like a username and text2 looks like a message
    if (text1.length > 2 && text1.length < 30 && 
        text2.length > 3 && 
        !text1.includes('Follow') && 
        !text1.includes('http') &&
        !text2.includes('Follow')) {
      
      messages.push({ 
        username: text1, 
        message: text2 
      })
    }
  }
  
  console.log(`Extracted ${messages.length} messages from patterns`)
  
  return messages
}