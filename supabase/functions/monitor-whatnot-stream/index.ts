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

    // Store each message in database (skip if demo mode)
    if (!isDemoMode) {
      for (const msg of messages) {
        // First, save to chat_messages table
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
          continue
        }

        // Then analyze with AI for purchase intent (call with service role to bypass auth)
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/analyze-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({
              message: msg.message,
              username: msg.username,
              platform: 'whatnot',
              stream_session_id: streamSessionId
            })
          })
        } catch (analyzeError) {
          console.error('AI analysis failed:', analyzeError)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messagesFound: messages.length,
        messages: messages.slice(0, 5) // Return first 5 for debugging
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