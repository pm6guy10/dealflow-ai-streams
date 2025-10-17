import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * This edge function works with the realtime-scraper.js service running on Render.
 * It processes individual messages as they come in from the realtime scraper
 * and automatically analyzes them for buying intent.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      message, 
      username, 
      streamSessionId, 
      platform = 'whatnot' 
    } = await req.json()

    if (!message || !username || !streamSessionId) {
      throw new Error('Missing required fields: message, username, streamSessionId')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Store the message in chat_messages table
    const { error: chatError } = await supabaseClient
      .from('chat_messages')
      .insert({
        stream_session_id: streamSessionId,
        username,
        message,
        platform
      })

    if (chatError) {
      console.error('Error saving chat message:', chatError)
    }

    // 2. Analyze message with AI for buying intent
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    
    if (!LOVABLE_API_KEY) {
      // Skip AI analysis if no API key
      return new Response(
        JSON.stringify({ 
          success: true, 
          analyzed: false,
          message: 'Message stored (AI analysis skipped)' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const systemPrompt = `You are an AI assistant that analyzes live stream chat messages to detect purchase intent.

Your job is to identify when someone is trying to buy something during a live stream sale.

Common purchase phrases:
- "I'll take it"
- "I'll buy it"
- "Sold to me"
- "Mine!"
- "I want it"
- "Gimme"
- "I need that"
- "Put me down for X"
- "Dibs"
- "How much?" (pricing question)
- "What size?" (product question)
- "Is it available?" (availability question)

Also look for:
- Questions about the product (shows interest)
- Pricing questions (shows buying intent)
- Size/condition questions (shows intent to purchase)

Be smart about context:
- Generic praise ("love it") without action is NOT a purchase
- "Maybe later" is NOT a purchase

If the message shows clear buying intent OR valuable seller insights (questions, feedback), mark is_buyer as true.`

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
          { role: 'user', content: `Analyze this chat message:\n\nUsername: ${username}\nMessage: "${message}"` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'detect_purchase',
              description: 'Detect if a chat message indicates purchase intent or valuable seller insight',
              parameters: {
                type: 'object',
                properties: {
                  is_buyer: {
                    type: 'boolean',
                    description: 'True if the message shows buying intent or valuable seller insight'
                  },
                  confidence: {
                    type: 'number',
                    description: 'Confidence level from 0.0 to 1.0'
                  },
                  item_description: {
                    type: 'string',
                    description: 'Description of the item if mentioned, otherwise empty string'
                  },
                  estimated_value: {
                    type: 'number',
                    description: 'Estimated value if a price is mentioned, otherwise 0'
                  },
                  message_type: {
                    type: 'string',
                    enum: ['direct_purchase', 'product_question', 'pricing_question', 'interest', 'general'],
                    description: 'Category of the message'
                  }
                },
                required: ['is_buyer', 'confidence', 'item_description', 'estimated_value', 'message_type'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'detect_purchase' } }
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('AI API Error:', errorText)
      throw new Error(`AI analysis failed: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
    
    if (!toolCall) {
      throw new Error('No tool call in AI response')
    }

    const analysis = JSON.parse(toolCall.function.arguments)
    console.log('AI Analysis:', { username, message, analysis })

    // 3. If high-confidence buyer intent, auto-capture to sales_captured
    if (analysis.is_buyer && analysis.confidence >= 0.7) {
      console.log('🔥 High-confidence buyer detected:', username)

      // Get the user_id from the stream_session
      const { data: sessionData } = await supabaseClient
        .from('stream_sessions')
        .select('user_id')
        .eq('id', streamSessionId)
        .single()

      if (sessionData?.user_id) {
        const { error: captureError } = await supabaseClient
          .from('sales_captured')
          .insert({
            user_id: sessionData.user_id,
            stream_session_id: streamSessionId,
            platform,
            buyer_username: username,
            message_text: message,
            item_description: analysis.item_description || null,
            estimated_value: analysis.estimated_value || null,
          })

        if (captureError) {
          console.error('Error capturing sale:', captureError)
        } else {
          console.log('✅ Sale auto-captured successfully')

          // Update stream session stats
          await supabaseClient.rpc('increment', {
            row_id: streamSessionId,
            x: 1
          })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analyzed: true,
        analysis: {
          is_buyer: analysis.is_buyer,
          confidence: analysis.confidence,
          message_type: analysis.message_type,
          auto_captured: analysis.is_buyer && analysis.confidence >= 0.7
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in monitor-realtime-stream:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
