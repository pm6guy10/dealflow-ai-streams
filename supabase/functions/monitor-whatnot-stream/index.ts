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

    // Store each message in database
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

      // Then analyze with AI for purchase intent
      const { error: analyzeError } = await supabaseClient.functions.invoke(
        'analyze-message',
        {
          body: {
            message: msg.message,
            username: msg.username,
            platform: 'whatnot',
            stream_session_id: streamSessionId
          }
        }
      )

      if (analyzeError) {
        console.error('AI analysis failed:', analyzeError)
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
  
  // Look for chat message patterns in the HTML
  // Whatnot messages typically appear as text nodes with usernames followed by messages
  
  // Strategy 1: Find patterns like "username\nSOME TEXT" in divs with margin-bottom: 8px
  const messageRegex = /style="display: flex;[^>]*margin-bottom: 8px[^>]*>[\s\S]*?<\/div>/gi
  const matches = html.match(messageRegex) || []
  
  console.log(`Found ${matches.length} potential message divs`)
  
  for (const match of matches) {
    // Extract text content from the div
    const textContent = match
      .replace(/<[^>]+>/g, '') // Remove all HTML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim()
    
    if (textContent.length > 0) {
      // Split by newlines to get username and message
      const lines = textContent.split('\n').filter(l => l.trim().length > 0)
      
      if (lines.length > 0) {
        // First line is typically the username
        const username = lines[0].trim()
        // Rest is the message
        const message = lines.slice(1).join(' ').trim() || lines[0]
        
        // Skip if it looks like system messages or empty
        if (username && username.length < 50) {
          messages.push({ username, message })
        }
      }
    }
  }
  
  // Strategy 2: Look for simpler patterns if Strategy 1 fails
  if (messages.length === 0) {
    // Try finding text between specific div patterns
    const simpleRegex = /<div[^>]*>([^<]+)<\/div>/gi
    let match
    let lastText = ''
    
    while ((match = simpleRegex.exec(html)) !== null) {
      const text = match[1].trim()
      if (text.length > 0 && text.length < 100) {
        // Every other text might be username vs message
        if (lastText) {
          messages.push({ username: lastText, message: text })
          lastText = ''
        } else {
          lastText = text
        }
      }
    }
  }
  
  return messages
}