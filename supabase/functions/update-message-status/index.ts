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

    const body = await req.json();
    const { 
      analysisId,
      username,
      status,
      editedMessage
    }: {
      analysisId: string;
      username: string;
      status: 'approved' | 'skipped';
      editedMessage?: string;
    } = body;

    if (!analysisId || !username || !status) {
      throw new Error('Missing required fields');
    }

    // Get the analysis to find the original message
    const { data: analysis, error: fetchError } = await supabase
      .from('stream_analyses')
      .select('intents_data')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !analysis) {
      throw new Error('Analysis not found');
    }

    const intents = analysis.intents_data as any[];
    const intent = intents.find((i: any) => i.username === username);

    if (!intent) {
      throw new Error('Intent not found');
    }

    // Create or update the message approval
    const { error: upsertError } = await supabase
      .from('message_approvals')
      .upsert({
        analysis_id: analysisId,
        user_id: user.id,
        username: username,
        original_message: intent.drafted_message,
        edited_message: editedMessage || null,
        status: status,
        approved_at: status === 'approved' ? new Date().toISOString() : null
      }, {
        onConflict: 'analysis_id,username'
      });

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    // Update the analysis intents_data to reflect the new status
    const updatedIntents = intents.map((i: any) => 
      i.username === username 
        ? { ...i, status, edited_message: editedMessage }
        : i
    );

    const { error: updateError } = await supabase
      .from('stream_analyses')
      .update({ intents_data: updatedIntents })
      .eq('id', analysisId);

    if (updateError) {
      console.error('Error updating analysis:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        status,
        message: status === 'approved' ? 'Message copied to clipboard!' : 'Message skipped'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
