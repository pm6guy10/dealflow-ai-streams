import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[ANALYZE-MESSAGE] ${step}`, details ? JSON.stringify(details) : '');
};

interface AnalyzeRequest {
  message: string;
  username: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'whatnot' | 'facebook';
  stream_session_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting message analysis');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    logStep('User authenticated', { userId: user.id });

    const body: AnalyzeRequest = await req.json();
    const { message, username, platform, stream_session_id } = body;

    if (!message || !username || !platform) {
      throw new Error('Missing required fields: message, username, platform');
    }

    logStep('Analyzing message', { username, platform, messageLength: message.length });

    // Call Lovable AI to analyze the message
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
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

Also extract:
- Item description if mentioned in the message or context
- Estimated value if a price is mentioned (extract the number)

Be smart about context:
- "How much is it?" is NOT a purchase
- "I love it" is NOT a purchase unless followed by purchase intent
- "Maybe later" is NOT a purchase

If the message is clearly a purchase attempt, mark is_purchase as true.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite', // Fast and cheap for real-time analysis
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this chat message:\n\nUsername: ${username}\nMessage: "${message}"` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'detect_purchase',
              description: 'Detect if a chat message indicates purchase intent and extract relevant details',
              parameters: {
                type: 'object',
                properties: {
                  is_purchase: {
                    type: 'boolean',
                    description: 'True if the message clearly indicates the user wants to buy/claim the item'
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
                    description: 'Numerical value if a price is mentioned, otherwise 0'
                  }
                },
                required: ['is_purchase', 'confidence', 'item_description', 'estimated_value'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'detect_purchase' } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep('AI API Error', { status: aiResponse.status, error: errorText });
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    logStep('AI response received', { hasToolCalls: !!aiData.choices?.[0]?.message?.tool_calls });

    // Extract tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    logStep('Analysis result', analysis);

    // If it's a purchase with high confidence, auto-capture it
    if (analysis.is_purchase && analysis.confidence >= 0.7) {
      logStep('High-confidence purchase detected, auto-capturing');

      const { error: captureError } = await supabase
        .from('sales_captured')
        .insert({
          user_id: user.id,
          platform,
          buyer_username: username,
          message_text: message,
          item_description: analysis.item_description || null,
          estimated_value: analysis.estimated_value || null,
          stream_session_id: stream_session_id || null,
        });

      if (captureError) {
        logStep('Error capturing sale', { error: captureError.message });
        // Don't throw - return analysis anyway
      } else {
        logStep('Sale auto-captured successfully');

        // Update stream stats if session provided
        if (stream_session_id) {
          await supabase.rpc('increment_stream_stats', {
            p_stream_id: stream_session_id,
            p_value: analysis.estimated_value || 0,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        ...analysis,
        auto_captured: analysis.is_purchase && analysis.confidence >= 0.7,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    logStep('ERROR', { message: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
