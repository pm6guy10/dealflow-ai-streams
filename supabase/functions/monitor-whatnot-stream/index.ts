import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const streamIdMatch = streamUrl.match(/whatnot\.com\/live\/([^/?]+)/);
    const whatnotStreamId = streamIdMatch ? streamIdMatch[1] : 'unknown';

    // Start background monitoring task
    const monitoringTask = async () => {
      let browser;
      try {
        logStep('Launching browser...');
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        logStep('Navigating to stream...');
        await page.goto(streamUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        logStep('Waiting for chat to load...');
        await page.waitForTimeout(3000);
        
        const processedMessages = new Set<string>();
        
        // Monitor for 1 hour max
        const startTime = Date.now();
        const maxDuration = 60 * 60 * 1000;
        
        while (Date.now() - startTime < maxDuration) {
          try {
            // Extract chat messages (runs in browser context)
            const messages = await page.evaluate(() => {
              const chatMessages: any[] = [];
              
              // @ts-ignore - document exists in browser context
              const doc = document;
              
              // Try multiple selectors for Whatnot chat
              const selectors = [
                '[data-testid="chat-message"]',
                '.chat-message',
                '[class*="ChatMessage"]',
                '[class*="chat-message"]'
              ];
              
              let messageElements: any[] = [];
              for (const selector of selectors) {
                messageElements = Array.from(doc.querySelectorAll(selector));
                if (messageElements.length > 0) break;
              }
              
              messageElements.forEach((el: any) => {
                const username = el.querySelector('[class*="username"]')?.textContent || 
                                el.querySelector('[class*="Username"]')?.textContent ||
                                el.querySelector('strong')?.textContent || 
                                'Unknown';
                const message = el.textContent?.replace(username, '').trim() || '';
                
                if (message) {
                  chatMessages.push({
                    username: username.trim(),
                    message: message,
                    timestamp: new Date().toISOString()
                  });
                }
              });
              
              return chatMessages;
            });

            // Process new messages
            for (const msg of messages) {
              const msgKey = `${msg.username}:${msg.message}`;
              
              if (!processedMessages.has(msgKey)) {
                processedMessages.add(msgKey);
                logStep('New message', { username: msg.username, message: msg.message });
                
                // Analyze message with AI
                try {
                  const analyzeResponse = await fetch(
                    `${Deno.env.get('SUPABASE_URL')}/functions/v1/analyze-message`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        message: msg.message,
                        username: msg.username,
                        platform: 'whatnot',
                        stream_session_id: streamSessionId,
                      }),
                    }
                  );

                  if (analyzeResponse.ok) {
                    const result = await analyzeResponse.json();
                    logStep('Analysis result', result);
                    
                    if (result.auto_captured) {
                      logStep('Purchase detected!', {
                        buyer: msg.username,
                        item: result.item_description
                      });
                    }
                  }
                } catch (analyzeError) {
                  logStep('Analysis error', analyzeError);
                }
              }
            }
            
            // Poll every 2 seconds
            await page.waitForTimeout(2000);
            
          } catch (innerError) {
            logStep('Monitoring loop error', innerError);
            await page.waitForTimeout(5000);
          }
        }
        
        logStep('Monitoring complete');
        
      } catch (error) {
        logStep('Browser error', error);
      } finally {
        if (browser) {
          await browser.close();
          logStep('Browser closed');
        }
      }
    };

    // Start monitoring in background (don't await)
    monitoringTask().catch(err => logStep('Background task error', err));

    // Return immediately
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Stream monitoring started',
        whatnotStreamId,
        streamSessionId,
        note: 'Monitoring active - watch your dashboard for captured sales!'
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
