import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (message: string, data?: any) => {
  console.log(`[monitor-whatnot-stream] ${message}`, data ? JSON.stringify(data) : '');
};

interface MonitorRequest {
  streamUrl: string;
  streamSessionId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    logStep('User authenticated', { userId: user.id });

    const { streamUrl, streamSessionId } = await req.json() as MonitorRequest;

    if (!streamUrl || !streamSessionId) {
      throw new Error('Missing required parameters');
    }

    logStep('Starting real-time monitoring', { streamUrl, streamSessionId });

    // Start background monitoring task
    const monitoringTask = (async () => {
      const seenMessages = new Set<string>();
      let isMonitoring = true;
      const maxDuration = 3600000; // 1 hour
      const startTime = Date.now();
      const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');

      if (!browserlessApiKey) {
        logStep('BROWSERLESS_API_KEY not configured');
        return;
      }

      try {
        while (isMonitoring && (Date.now() - startTime) < maxDuration) {
          try {
            logStep('Fetching chat with Browserless', { url: streamUrl });

            // Use Browserless to scrape JavaScript-rendered content
            const browserlessResponse = await fetch(
              `https://production-sfo.browserless.io/content?token=${browserlessApiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: streamUrl,
                  waitFor: 5000, // Wait longer for chat to load
                  gotoOptions: {
                    waitUntil: 'networkidle0' // Wait for all network activity to finish
                  }
                })
              }
            );

            if (!browserlessResponse.ok) {
              const errorText = await browserlessResponse.text();
              logStep('Browserless request failed', { 
                status: browserlessResponse.status,
                error: errorText 
              });
              await new Promise(resolve => setTimeout(resolve, 5000));
              continue;
            }

            const html = await browserlessResponse.text();
            logStep('Received HTML from Browserless', { 
              htmlLength: html.length,
              preview: html.substring(0, 500) 
            });
            
            const doc = new DOMParser().parseFromString(html, 'text/html');

            if (!doc) {
              logStep('Failed to parse HTML from Browserless');
              await new Promise(resolve => setTimeout(resolve, 5000));
              continue;
            }

            // Try multiple selectors to find chat messages
            const chatSelectors = [
              '[data-testid="chat-message"]',
              '[class*="chat-message"]',
              '[class*="ChatMessage"]',
              '[class*="message-container"]',
              '[role="log"] div',
              '[class*="LiveChat"] div[class*="message"]',
              'div[class*="Message"]',
              '[class*="comment"]'
            ];

            let messageElements: any[] = [];
            for (const selector of chatSelectors) {
              const elements = doc.querySelectorAll(selector);
              if (elements && elements.length > 0) {
                messageElements = Array.from(elements);
                logStep('Found messages with selector', { selector, count: messageElements.length });
                break;
              }
            }

            if (messageElements.length === 0) {
              logStep('No chat messages found - will retry');
              await new Promise(resolve => setTimeout(resolve, 5000));
              continue;
            }

            // Extract and process messages
            for (const element of messageElements) {
              try {
                const textContent = element.textContent?.trim() || '';
                if (!textContent || textContent.length < 3) continue;

                // Create a unique ID for this message
                const messageId = `${textContent}-${element.innerHTML?.substring(0, 50)}`;
                
                if (seenMessages.has(messageId)) continue;
                seenMessages.add(messageId);

                // Try to extract username and message
                let username = 'Unknown';
                let message = textContent;

                // Look for username patterns
                const usernameElement = element.querySelector('[class*="username"], [class*="Username"], [data-testid*="username"], [class*="author"]');
                if (usernameElement) {
                  username = usernameElement.textContent?.trim() || 'Unknown';
                  const messageElement = element.querySelector('[class*="message-text"], [class*="MessageText"], [class*="text"]');
                  if (messageElement) {
                    message = messageElement.textContent?.trim() || textContent;
                  }
                } else {
                  // Try to split username from message if format is "username: message"
                  const colonIndex = textContent.indexOf(':');
                  if (colonIndex > 0 && colonIndex < 30) {
                    username = textContent.substring(0, colonIndex).trim();
                    message = textContent.substring(colonIndex + 1).trim();
                  }
                }

                logStep('New message detected', { username, messagePreview: message.substring(0, 50) });

                // Send to analyze-message function
                const { data: analysisData, error: analysisError } = await supabaseClient.functions.invoke(
                  'analyze-message',
                  {
                    body: {
                      message,
                      username,
                      platform: 'whatnot',
                      stream_session_id: streamSessionId
                    }
                  }
                );

                if (analysisError) {
                  logStep('Analysis error', { error: analysisError });
                } else if (analysisData) {
                  logStep('Message analyzed', { 
                    isPurchase: analysisData.is_purchase,
                    confidence: analysisData.confidence 
                  });

                  if (analysisData.is_purchase && analysisData.auto_captured) {
                    logStep('Purchase detected and captured!', {
                      buyer: username,
                      item: analysisData.item_description
                    });
                  }
                }
              } catch (msgError: any) {
                logStep('Error processing message', { error: msgError.message });
              }
            }

            // Keep old messages in memory (limit to last 100)
            if (seenMessages.size > 100) {
              const messagesArray = Array.from(seenMessages);
              seenMessages.clear();
              messagesArray.slice(-100).forEach(msg => seenMessages.add(msg));
            }

          } catch (fetchError: any) {
            logStep('Error in monitoring loop', { error: fetchError.message });
          }

          // Wait 5 seconds before next poll
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

        logStep('Monitoring ended', { reason: isMonitoring ? 'timeout' : 'stopped' });
      } catch (error: any) {
        logStep('Fatal monitoring error', { error: error.message });
      }
    })();

    // Don't await - let it run in background
    monitoringTask.catch(err => logStep('Background task error', err));

    logStep('Monitoring task initiated', { streamUrl, sessionId: streamSessionId });

    // Return immediate response while monitoring continues in background
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Monitoring started - scraping real chat data',
        sessionId: streamSessionId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    logStep('ERROR', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
