import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[CAPTURE-SALE] ${step}`, details ? JSON.stringify(details) : '');
};

interface CaptureSaleRequest {
  platform: 'tiktok' | 'instagram' | 'youtube' | 'whatnot' | 'facebook';
  buyer_username: string;
  message_text: string;
  item_description?: string;
  estimated_value?: number;
  stream_session_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Capturing sale');

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

    // Verify subscription is active
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_ends_at')
      .eq('id', user.id)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    const validStatuses = ['trial', 'active'];
    const now = new Date();
    const subscriptionEnd = profile.subscription_ends_at ? new Date(profile.subscription_ends_at) : null;
    
    const isValid = validStatuses.includes(profile.subscription_status) &&
                   (!subscriptionEnd || now < subscriptionEnd);

    if (!isValid) {
      throw new Error('Subscription not active');
    }

    logStep('Subscription verified');

    const body: CaptureSaleRequest = await req.json();

    // Validate required fields
    if (!body.platform || !body.buyer_username || !body.message_text) {
      throw new Error('Missing required fields');
    }

    // Insert sale record
    const { data: sale, error: insertError } = await supabase
      .from('sales_captured')
      .insert({
        user_id: user.id,
        platform: body.platform,
        buyer_username: body.buyer_username,
        message_text: body.message_text,
        item_description: body.item_description,
        estimated_value: body.estimated_value,
        stream_session_id: body.stream_session_id || null,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to capture sale: ${insertError.message}`);
    }

    // Update stream session stats if provided
    if (body.stream_session_id) {
      const { error: updateError } = await supabase.rpc('increment_stream_stats', {
        p_stream_id: body.stream_session_id,
        p_value: body.estimated_value || 0,
      });

      if (updateError) {
        logStep('Failed to update stream stats', { error: updateError.message });
      }
    }

    logStep('Sale captured', { saleId: sale.id });

    return new Response(
      JSON.stringify({ success: true, sale }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    logStep('ERROR', { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
