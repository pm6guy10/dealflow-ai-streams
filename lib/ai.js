// DealFlow AI - Claude Integration for Intent Detection & Message Drafting
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

/**
 * Detect buying intent from messages and draft personalized DMs
 * @param {Array} messages - Array of {username, message, timestamp}
 * @param {Object} context - Stream context {sellerName, category, streamUrl}
 * @returns {Promise<Array>} - Array of detected intents with drafted messages
 */
async function analyzeStreamForIntents(messages, context = {}) {
  if (!messages || messages.length === 0) {
    return [];
  }

  console.log(`Analyzing ${messages.length} messages for buyer intent...`);

  // Step 1: Detect which messages show buying intent using Claude
  const intentDetectionPrompt = `You are analyzing live stream chat messages to detect genuine buying intent.

Context:
- Platform: Whatnot (live shopping)
- Seller: ${context.sellerName || 'the seller'}
- Category: ${context.category || 'various items'}

Your job: Review these messages and identify which ones show GENUINE buying intent.

Buying intent signals:
- Direct purchase: "I'll take it", "sold", "mine", "claiming"
- Questions about availability: "do you have", "is this available", "got size"
- Specific requests: size, color, price questions
- Payment/shipping questions
- Urgency: "hold it for me", "put me down"

NOT buying intent:
- Generic compliments: "nice", "cool"
- Questions about the stream itself
- Greetings or chat
- Spam or ads

Messages to analyze:
${messages.slice(0, 50).map((msg, i) => `${i + 1}. @${msg.username}: "${msg.message}"`).join('\n')}

Output format (JSON only, no explanation):
{
  "intents": [
    {"index": 1, "confidence": "high|medium", "item_wanted": "blue sweater", "details": "size M"},
    ...
  ]
}

Only include messages with clear buying intent. Be selective.`;

  let detectedIntents = [];

  try {
    const intentResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: intentDetectionPrompt
      }]
    });

    const responseText = intentResponse.content[0].text;
    console.log('Claude intent detection response:', responseText);

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      detectedIntents = parsed.intents || [];
    }
  } catch (error) {
    console.error('Intent detection error:', error.message);
    // Fallback to keyword-based detection
    detectedIntents = fallbackIntentDetection(messages);
  }

  console.log(`Found ${detectedIntents.length} buyer intents`);

  // Step 2: Draft personalized messages for each intent
  const results = [];

  for (const intent of detectedIntents.slice(0, 20)) { // Limit to 20 for now
    const msgIndex = intent.index - 1;
    if (msgIndex < 0 || msgIndex >= messages.length) continue;

    const originalMsg = messages[msgIndex];

    try {
      const draftedMessage = await draftPersonalizedMessage(
        originalMsg,
        intent,
        context
      );

      results.push({
        username: originalMsg.username,
        timestamp: originalMsg.timestamp,
        original_comment: originalMsg.message,
        item_wanted: intent.item_wanted || 'item',
        details: intent.details || '',
        drafted_message: draftedMessage,
        confidence: intent.confidence || 'medium',
        status: 'pending'
      });

      // Rate limiting - wait 1 second between API calls
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Error drafting message for @${originalMsg.username}:`, error.message);
    }
  }

  return results;
}

/**
 * Draft a personalized DM for a buyer
 */
async function draftPersonalizedMessage(originalMessage, intent, context) {
  const prompt = `You're helping a Whatnot seller follow up with buyers after a live stream.

Context:
- Seller name: ${context.sellerName || 'the seller'}
- Stream was about: ${context.category || 'various items'}
- Item mentioned: ${intent.item_wanted || 'an item'}
${intent.details ? `- Details: ${intent.details}` : ''}

Buyer comment from stream:
"${originalMessage.message}"

Write a casual, friendly DM from the seller to @${originalMessage.username}:
- Confirm what they wanted
- Sound excited and personable (it's live shopping, very casual)
- Include a price if it seems appropriate (estimate $30-100 based on context)
- Ask if they want a payment link
- Keep under 50 words
- Use 1-2 emojis MAX (or none)
- NO corporate language, be human and warm
- Address them by name without the @

Output ONLY the message text, nothing else. No quotes, no explanation.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  let draftedText = response.content[0].text.trim();
  
  // Clean up any quotes
  draftedText = draftedText.replace(/^["']|["']$/g, '');
  
  return draftedText;
}

/**
 * Fallback intent detection using keywords (if Claude API fails)
 */
function fallbackIntentDetection(messages) {
  const STRONG_INTENT_KEYWORDS = [
    'ill take', "i'll take", 'sold', 'mine', 'claiming', 'dibs',
    'i want', 'i need', 'buying', 'buy it', 'gimme', 'give me',
    'size', 'color', 'price', 'how much', 'payment', 'shipping'
  ];

  return messages
    .map((msg, index) => {
      const lowerMsg = msg.message.toLowerCase();
      const hasIntent = STRONG_INTENT_KEYWORDS.some(kw => lowerMsg.includes(kw));
      
      if (hasIntent) {
        return {
          index: index + 1,
          confidence: 'medium',
          item_wanted: 'item from stream',
          details: ''
        };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 10); // Limit to 10 for fallback
}

module.exports = {
  analyzeStreamForIntents,
  draftPersonalizedMessage
};

