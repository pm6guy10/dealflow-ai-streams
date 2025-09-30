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

    // ADVANCED SCORING SYSTEM - Multi-signal detection
    const msg = message.toLowerCase();
    const signals: string[] = [];
    let advancedScore = 0;

    // 1. Direct buy patterns (high confidence)
    const directBuyPatterns = [
      /\b(i'll take|sold|dibs|claim|mine|buying|purchase)\b/,
      /\b(ship it|send it|want this|need this)\b/,
      /\b(add to cart|checkout|invoice me)\b/
    ];
    
    for (const pattern of directBuyPatterns) {
      if (pattern.test(msg)) {
        signals.push('direct_buy');
        advancedScore += 90;
        break;
      }
    }

    // 2. Subtle buy patterns (hidden signals)
    const commitmentPatterns = [
      /\b(definitely|for sure|100%|absolutely)\b/,
      /\b(need|must have|been looking for)\b/,
      /\b(perfect|exactly what|just what)\b/
    ];
    
    const logisticsPatterns = [
      /\b(my zip|my address|to \d{5})\b/,
      /\b(paypal|venmo|cashapp|zelle)\b/,
      /\b(tonight|today|asap|right now)\b/
    ];
    
    const comparisonPatterns = [
      /\b(better than|vs|versus|or the)\b/,
      /\b(both|all of them|whole set)\b/,
      /\b(last one|only one left)\b/
    ];

    for (const pattern of commitmentPatterns) {
      if (pattern.test(msg)) {
        signals.push('subtle_commitment');
        advancedScore += 40;
      }
    }
    
    for (const pattern of logisticsPatterns) {
      if (pattern.test(msg)) {
        signals.push('subtle_logistics');
        advancedScore += 40;
      }
    }
    
    for (const pattern of comparisonPatterns) {
      if (pattern.test(msg)) {
        signals.push('subtle_comparison');
        advancedScore += 40;
      }
    }

    // 3. High-value question patterns
    const highValueQuestions = [
      /\b(wholesale|bulk|multiple|dozen)\b/,
      /\b(authentic|real|genuine|legit)\b/,
      /\b(today|tonight|now|asap)\b/,
      /\b(hold|reserve|save|put aside)\b/
    ];
    
    for (const pattern of highValueQuestions) {
      if (pattern.test(msg)) {
        signals.push('high_value_question');
        advancedScore += 35;
      }
    }

    // 4. Emoji intelligence
    const buyerEmojis = /[💰💵💳🤑🔥🙌👍]/;
    if (buyerEmojis.test(message)) {
      signals.push('emoji_intent');
      advancedScore += 20;
    }

    // Combine AI score with advanced scoring (weighted average)
    const finalScore = Math.min(100, Math.round((analysis.intent_score * 100 * 0.4) + (advancedScore * 0.6))) / 100;

    // Classification based on final score
    let intent: string, confidence: string, action: string | null;
    
    if (finalScore >= 0.8) {
      intent = 'HOT_LEAD';
      confidence = 'high';
      action = 'Contact immediately - very likely to buy';
    } else if (finalScore >= 0.5) {
      intent = 'WARM_LEAD';
      confidence = 'medium';
      action = 'Follow up within 2 hours';
    } else if (finalScore >= 0.3) {
      intent = 'INTERESTED';
      confidence = 'low';
      action = 'Add to nurture list';
    } else if (signals.length > 0) {
      intent = 'BROWSING';
      confidence = 'minimal';
      action = 'Monitor for escalation';
    } else {
      intent = 'NOISE';
      confidence = 'none';
      action = null;
    }

    // Revenue estimation
    let estimatedValue = 0;
    if (signals.includes('direct_buy')) estimatedValue = 50;
    else if (signals.includes('subtle_commitment')) estimatedValue = 35;
    else if (signals.includes('high_value_question')) estimatedValue = 25;
    else estimatedValue = 10;
    
    if (signals.includes('subtle_logistics')) estimatedValue *= 1.5;
    if (signals.includes('emoji_intent')) estimatedValue *= 1.2;
    estimatedValue = Math.round(estimatedValue);

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
        ai_intent_score: finalScore,
        ai_intent_type: intent,
        ai_extracted_item: analysis.extracted_item,
        ai_extracted_price: analysis.extracted_price,
        ai_urgency_level: analysis.urgency_level,
        ai_sentiment: analysis.sentiment,
        confidence_level: confidence,
        signals: signals,
        action_recommended: action,
        revenue_attributed: estimatedValue
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
      is_high_intent: finalScore > 0.7
    });

    if (updateError) {
      console.error('Stream update error:', updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      message_id: chatMessage.id,
      analysis: {
        intent_score: finalScore,
        intent_type: intent,
        confidence: confidence,
        urgency_level: analysis.urgency_level,
        extracted_item: analysis.extracted_item,
        extracted_price: analysis.extracted_price,
        sentiment: analysis.sentiment,
        estimated_value: estimatedValue,
        signals: signals,
        action_recommended: action,
        follow_up_recommended: finalScore > 0.6
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