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
    const { messageId, customInstructions } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

    // Get the chat message details
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', messageId)
      .eq('user_id', user.id)
      .single();

    if (messageError || !message) {
      throw new Error('Message not found');
    }

    // Generate personalized follow-up using AI
    const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are an expert live stream sales follow-up specialist. Create personalized DM templates that convert viewers into buyers.

GUIDELINES:
- Keep messages under 160 characters (SMS-friendly)
- Use friendly, casual tone
- Create urgency without being pushy
- Reference specific items/prices when available
- Include clear call-to-action
- Personalize with username when possible

INTENT-BASED TEMPLATES:

HIGH INTENT (buy_intent, critical urgency):
- "Hey [username]! Saw you were interested in [item]. I've got it reserved for you for the next 30 mins. Ready to claim it?"

MEDIUM INTENT (questions, availability):
- "Hi [username]! Quick answer on [item] - [answer]. Still available if you want it! Link: [shop_link]"

PRICE INQUIRIES:
- "[username], that [item] is $[price]. Special deal for live viewers - can do $[discounted_price]. Interested?"

SHIPPING QUESTIONS:
- "Hey [username]! [item] ships same day to [location]. Want me to get it ready for you?"

Generate 3 different follow-up options based on the context.`
          },
          {
            role: "user",
            content: `Create follow-up messages for this chat interaction:

Message: "${message.message_text}"
Username: ${message.platform_username || 'there'}
Intent: ${message.ai_intent_type}
Urgency: ${message.ai_urgency_level}
Item mentioned: ${message.ai_extracted_item || 'N/A'}
Price mentioned: ${message.ai_extracted_price ? '$' + message.ai_extracted_price : 'N/A'}
Intent Score: ${message.ai_intent_score}

${customInstructions ? `Additional instructions: ${customInstructions}` : ''}

Return 3 follow-up options in JSON format:
{
  "options": [
    {"template": "message text", "tone": "urgent|friendly|professional"},
    {"template": "message text", "tone": "urgent|friendly|professional"},
    {"template": "message text", "tone": "urgent|friendly|professional"}
  ]
}`
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      }),
    });

    if (!followUpResponse.ok) {
      console.error('AI follow-up generation failed:', await followUpResponse.text());
      throw new Error('AI follow-up generation failed');
    }

    const followUpData = await followUpResponse.json();
    const aiContent = followUpData.choices[0].message.content;
    
    let followUpOptions;
    try {
      followUpOptions = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      // Fallback templates
      const username = message.platform_username || 'there';
      const item = message.ai_extracted_item || 'that item';
      
      followUpOptions = {
        options: [
          {
            template: `Hey ${username}! Saw your message about ${item}. Still available if you're interested!`,
            tone: "friendly"
          },
          {
            template: `Hi ${username}! Quick follow-up on ${item} - want me to hold it for you?`,
            tone: "professional"
          },
          {
            template: `${username}, ${item} is going fast! Let me know if you want it secured.`,
            tone: "urgent"
          }
        ]
      };
    }

    return new Response(JSON.stringify({
      success: true,
      message: {
        id: message.id,
        username: message.platform_username,
        text: message.message_text,
        intent_type: message.ai_intent_type,
        intent_score: message.ai_intent_score,
        urgency: message.ai_urgency_level,
        item: message.ai_extracted_item,
        price: message.ai_extracted_price
      },
      follow_up_options: followUpOptions.options
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-follow-up:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});