import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[ANALYZE-STREAM-INTENTS] ${step}`, details ? JSON.stringify(details) : '');
};

interface CommentData {
  username: string;
  message: string;
  timestamp?: string;
}

interface BuyerIntent {
  username: string;
  timestamp: string;
  comment: string;
  item_wanted: string;
  details: string;
  drafted_message: string;
  status: 'pending' | 'approved' | 'skipped';
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting stream analysis');

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

    const body = await req.json();
    const { 
      comments, 
      streamUrl, 
      sellerName = 'the seller',
      streamCategory = 'live shopping'
    }: {
      comments: CommentData[];
      streamUrl: string;
      sellerName?: string;
      streamCategory?: string;
    } = body;

    if (!comments || !Array.isArray(comments) || comments.length === 0) {
      throw new Error('No comments provided');
    }

    logStep('Analyzing comments', { count: comments.length });

    // Get Claude API key
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Step 1: Batch analyze all comments for buying intent
    const intentDetectionPrompt = `You are analyzing comments from a Whatnot live stream to detect buying intent.

Stream context:
- Seller: ${sellerName}
- Category: ${streamCategory}

Here are the comments (username: message):
${comments.map(c => `${c.username}: "${c.message}"`).join('\n')}

Identify ALL comments that show buying intent. Look for:
- Direct purchases: "I'll take it", "sold", "mine", "claiming", "dibs"
- Questions about buying: "what size do you have", "how much", "price"
- Requests: "do you have X", "I want", "I need", "can I get"
- Size/color/variant questions (strong intent)
- Payment/shipping questions

For each comment with buying intent, extract:
1. What item they want (be specific if mentioned, general if not)
2. Details they mentioned (size, color, condition, etc.)
3. Confidence level (0.0-1.0)

Return a JSON array of objects with this structure:
{
  "username": "string",
  "comment": "string",
  "item_wanted": "string",
  "details": "string",
  "confidence": number
}

Only include comments with clear buying intent. Be conservative - don't flag casual comments like "that's cool" or "nice".`;

    const intentResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: intentDetectionPrompt
        }]
      })
    });

    if (!intentResponse.ok) {
      const errorText = await intentResponse.text();
      logStep('Claude API Error', { status: intentResponse.status, error: errorText });
      throw new Error(`Claude API failed: ${intentResponse.status}`);
    }

    const intentData = await intentResponse.json();
    const intentText = intentData.content[0].text;
    logStep('Intent detection response received');

    // Parse the JSON response
    let detectedIntents: Array<{
      username: string;
      comment: string;
      item_wanted: string;
      details: string;
      confidence: number;
    }> = [];

    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = intentText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || 
                        intentText.match(/(\[[\s\S]*\])/);
      const jsonStr = jsonMatch ? jsonMatch[1] : intentText;
      detectedIntents = JSON.parse(jsonStr);
    } catch (parseError) {
      logStep('Failed to parse intent JSON, using empty array', { error: parseError.message });
      detectedIntents = [];
    }

    logStep('Intents detected', { count: detectedIntents.length });

    if (detectedIntents.length === 0) {
      return new Response(
        JSON.stringify({
          intents: [],
          totalIntents: 0,
          estimatedValue: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Step 2: Generate personalized messages for each intent
    const buyerIntents: BuyerIntent[] = [];

    for (const intent of detectedIntents) {
      const messagePrompt = `You're helping a Whatnot seller follow up with buyers after a live stream.

Context:
- Seller name: ${sellerName}
- Stream was about: ${streamCategory}
- Item mentioned: ${intent.item_wanted}
- Details: ${intent.details || 'not specified'}

Buyer comment from stream:
"${intent.comment}"

Write a casual, friendly DM from the seller to this buyer:
- Confirm what they wanted
- Sound excited and personable (it's live shopping, very casual)
- Include a placeholder for price like "$[PRICE]" if you need to reference it
- Ask if they want payment link
- Keep under 50 words
- Use emoji sparingly (1-2 max)
- NO corporate language, be human
- Use "Hey" or "Hi" to start

Output ONLY the message text, nothing else. No quotes, no formatting, just the message.`;

      const messageResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 200,
          temperature: 0.7,
          messages: [{
            role: 'user',
            content: messagePrompt
          }]
        })
      });

      if (!messageResponse.ok) {
        logStep('Message generation failed for user', { username: intent.username });
        continue;
      }

      const messageData = await messageResponse.json();
      const draftedMessage = messageData.content[0].text.trim();

      // Find the original timestamp
      const originalComment = comments.find(c => 
        c.username === intent.username && c.message === intent.comment
      );

      buyerIntents.push({
        username: intent.username,
        timestamp: originalComment?.timestamp || new Date().toISOString(),
        comment: intent.comment,
        item_wanted: intent.item_wanted,
        details: intent.details,
        drafted_message: draftedMessage,
        status: 'pending',
        confidence: intent.confidence
      });

      logStep('Message generated', { username: intent.username });
    }

    // Save the analysis to the database
    const { data: analysisData, error: insertError } = await supabase
      .from('stream_analyses')
      .insert({
        user_id: user.id,
        stream_url: streamUrl,
        total_comments: comments.length,
        total_intents: buyerIntents.length,
        intents_data: buyerIntents,
        analyzed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      logStep('Error saving analysis', { error: insertError.message });
      // Don't throw - still return the results
    }

    const estimatedValue = buyerIntents.length * 50; // $50 avg per buyer

    logStep('Analysis complete', { 
      intents: buyerIntents.length, 
      estimatedValue 
    });

    return new Response(
      JSON.stringify({
        intents: buyerIntents,
        totalIntents: buyerIntents.length,
        estimatedValue,
        analysisId: analysisData?.id,
        streamUrl
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
