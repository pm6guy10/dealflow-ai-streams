import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, streamId, platformUserId, platformUsername } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Analyze message with AI
    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert live stream sales analyst. Analyze chat messages to extract purchase intent, urgency, and opportunities.

CRITICAL: Respond ONLY with valid JSON. No explanations, no markdown, no extra text.

For each message, return:
{
  "intent_score": 0.0-1.0 (confidence of purchase intent),
  "intent_type": "buy_intent|question|price_inquiry|shipping_question|availability_check|chatter|unknown",
  "extracted_item": "item name if mentioned" or null,
  "extracted_price": price as number or null,
  "urgency_level": "low|medium|high|critical",
  "sentiment": "positive|neutral|negative",
  "reasoning": "brief explanation of classification"
}

HIGH INTENT SIGNALS:
- "I'll take it", "sold", "mine", "dibs", "buy", "purchase"
- Price negotiations, shipping questions
- Size/color/variant requests
- "Hold for me", "save it"

MEDIUM INTENT:
- "How much?", "price?", "available?"
- "Still have?", "in stock?"
- "When can you ship?"

LOW INTENT:
- General questions, compliments
- Casual chat, emojis only`
          },
          {
            role: "user",
            content: `Analyze this live stream chat message: "${message}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      }),
    });

    if (!analysisResponse.ok) {
      console.error('AI analysis failed:', await analysisResponse.text());
      throw new Error('AI analysis failed');
    }

    const analysisData = await analysisResponse.json();
    const aiContent = analysisData.choices[0].message.content;
    
    let analysis;
    try {
      analysis = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      // Fallback to basic analysis
      analysis = {
        intent_score: 0.1,
        intent_type: "unknown",
        extracted_item: null,
        extracted_price: null,
        urgency_level: "low",
        sentiment: "neutral",
        reasoning: "AI analysis failed, using fallback"
      };
    }

    // Get auth header to identify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid or expired token');
    }

    // Store the analyzed message in database
    const { data: chatMessage, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        stream_id: streamId,
        user_id: user.id,
        platform_user_id: platformUserId,
        platform_username: platformUsername,
        message_text: message,
        ai_intent_score: analysis.intent_score,
        ai_intent_type: analysis.intent_type,
        ai_extracted_item: analysis.extracted_item,
        ai_extracted_price: analysis.extracted_price,
        ai_urgency_level: analysis.urgency_level,
        ai_sentiment: analysis.sentiment
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to store message');
    }

    // Update stream statistics - use RPC call for atomic increment
    const { error: updateError } = await supabase.rpc('increment_stream_stats', {
      stream_id: streamId,
      is_high_intent: analysis.intent_score > 0.7
    });

    if (updateError) {
      console.error('Stream update error:', updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      message_id: chatMessage.id,
      analysis: {
        intent_score: analysis.intent_score,
        intent_type: analysis.intent_type,
        urgency_level: analysis.urgency_level,
        extracted_item: analysis.extracted_item,
        extracted_price: analysis.extracted_price,
        sentiment: analysis.sentiment,
        follow_up_recommended: analysis.intent_score > 0.6
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat-analysis:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});