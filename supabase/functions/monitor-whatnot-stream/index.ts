import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to log steps
const logStep = (step: string, data?: any) => {
  console.log(`[monitor-whatnot-stream] ${step}`, data || '');
};

interface MonitorRequest {
  streamUrl: string;
  streamSessionId: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting Whatnot stream monitor');

    // Get user from auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { streamUrl, streamSessionId }: MonitorRequest = await req.json();
    logStep('Monitoring URL', streamUrl);

    if (!streamUrl || !streamUrl.includes('whatnot.com')) {
      throw new Error('Invalid Whatnot URL');
    }

    // Scrape the Whatnot stream page
    // Note: This is a simplified approach. Whatnot likely loads chat via JS/WebSocket
    // For MVP, we'll attempt to fetch the page and parse what we can
    // TODO: Implement proper scraping with Puppeteer or intercept WebSocket messages
    
    logStep('Fetching stream page...');
    const response = await fetch(streamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stream: ${response.status}`);
    }

    const html = await response.text();
    logStep('Fetched page, length:', html.length);

    // Extract stream ID from URL for reference
    const streamIdMatch = streamUrl.match(/whatnot\.com\/live\/([^/?]+)/);
    const whatnotStreamId = streamIdMatch ? streamIdMatch[1] : 'unknown';

    // For now, return instructions for Phase 2 implementation
    // In production, this would:
    // 1. Launch a headless browser with Puppeteer
    // 2. Navigate to the URL
    // 3. Wait for chat container to load
    // 4. Set up MutationObserver to watch for new messages
    // 5. Extract message text + username
    // 6. Call analyze-message edge function
    // 7. If purchase detected, insert into sales_captured table
    // 8. Continue monitoring until stream ends or timeout

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Stream monitoring initiated',
        whatnotStreamId,
        note: 'Phase 1: Page fetch successful. Phase 2 will implement real-time chat scraping with Puppeteer.',
        htmlLength: html.length,
        streamSessionId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    logStep('ERROR', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Stream monitoring failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
