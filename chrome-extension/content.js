// DealFlow Content Script - Captures live stream chat messages
console.log('[DealFlow] Extension loaded on:', window.location.hostname);

let isActive = false;
let processedMessages = new Set();
let streamSessionId = null;
let apiEndpoint = null;
let authToken = null;

// Platform-specific chat selectors
const PLATFORM_SELECTORS = {
  youtube: {
    chatContainer: '#chat-messages, #items.yt-live-chat-item-list-renderer',
    messageItem: 'yt-live-chat-text-message-renderer',
    username: '#author-name',
    messageText: '#message',
  },
  tiktok: {
    chatContainer: '[data-e2e="comment-list"]',
    messageItem: '[data-e2e="comment-item"]',
    username: '[data-e2e="comment-username"]',
    messageText: '[data-e2e="comment-text"]',
  },
  whatnot: {
    chatContainer: '[class*="ChatFeed"]',
    messageItem: '[class*="Message"]',
    username: '[class*="username"]',
    messageText: '[class*="text"]',
  },
  facebook: {
    chatContainer: '[role="log"]',
    messageItem: '[role="article"]',
    username: 'a[role="link"]',
    messageText: '[dir="auto"]',
  },
};

// Detect current platform
function detectPlatform() {
  const hostname = window.location.hostname;
  if (hostname.includes('youtube.com')) return 'youtube';
  if (hostname.includes('tiktok.com')) return 'tiktok';
  if (hostname.includes('whatnot.com')) return 'whatnot';
  if (hostname.includes('facebook.com')) return 'facebook';
  if (hostname.includes('instagram.com')) return 'instagram';
  return null;
}

// Extract chat messages from DOM
function extractMessage(element, platform) {
  const selectors = PLATFORM_SELECTORS[platform];
  if (!selectors) return null;

  try {
    const usernameEl = element.querySelector(selectors.username);
    const messageEl = element.querySelector(selectors.messageText);

    if (!usernameEl || !messageEl) return null;

    const username = usernameEl.textContent?.trim();
    const message = messageEl.textContent?.trim();

    if (!username || !message) return null;

    return { username, message };
  } catch (error) {
    console.error('[DealFlow] Error extracting message:', error);
    return null;
  }
}

// Send message to backend for analysis
async function analyzeMessage(username, message, platform) {
  if (!apiEndpoint || !authToken) {
    console.warn('[DealFlow] Not configured - missing API endpoint or auth token');
    return;
  }

  try {
    const response = await fetch(`${apiEndpoint}/functions/v1/analyze-message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        username,
        platform,
        stream_session_id: streamSessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('[DealFlow] Analysis result:', result);

    // Show notification if purchase detected
    if (result.is_purchase) {
      chrome.runtime.sendMessage({
        type: 'SALE_DETECTED',
        data: {
          username,
          message,
          confidence: result.confidence,
          autoCaptured: result.auto_captured,
          itemDescription: result.item_description,
          estimatedValue: result.estimated_value,
        },
      });
    }

    return result;
  } catch (error) {
    console.error('[DealFlow] Error analyzing message:', error);
    return null;
  }
}

// Monitor chat for new messages
function startMonitoring(platform) {
  const selectors = PLATFORM_SELECTORS[platform];
  if (!selectors) {
    console.error('[DealFlow] Unsupported platform:', platform);
    return;
  }

  console.log('[DealFlow] Starting chat monitor for:', platform);

  // Use MutationObserver to watch for new chat messages
  const observer = new MutationObserver((mutations) => {
    if (!isActive) return;

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        // Check if this is a chat message
        const messageElement = node.matches?.(selectors.messageItem)
          ? node
          : node.querySelector?.(selectors.messageItem);

        if (!messageElement) return;

        // Create unique ID for this message
        const messageId = messageElement.innerText || Math.random().toString();
        if (processedMessages.has(messageId)) return;

        processedMessages.add(messageId);

        // Extract and analyze
        const extracted = extractMessage(messageElement, platform);
        if (extracted) {
          console.log('[DealFlow] New message:', extracted);
          analyzeMessage(extracted.username, extracted.message, platform);
        }
      });
    });
  });

  // Find chat container
  const findContainer = () => {
    const container = document.querySelector(selectors.chatContainer);
    if (container) {
      console.log('[DealFlow] Chat container found, starting observer');
      observer.observe(container, {
        childList: true,
        subtree: true,
      });
      return true;
    }
    return false;
  };

  // Try to find container, retry if not found
  if (!findContainer()) {
    console.log('[DealFlow] Chat container not found, will retry...');
    const retryInterval = setInterval(() => {
      if (findContainer()) {
        clearInterval(retryInterval);
      }
    }, 2000);

    // Stop retrying after 30 seconds
    setTimeout(() => clearInterval(retryInterval), 30000);
  }

  return observer;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[DealFlow] Received message:', request.type);

  if (request.type === 'START_MONITORING') {
    isActive = true;
    streamSessionId = request.streamSessionId;
    apiEndpoint = request.apiEndpoint;
    authToken = request.authToken;

    const platform = detectPlatform();
    if (platform) {
      startMonitoring(platform);
      sendResponse({ success: true, platform });
    } else {
      sendResponse({ success: false, error: 'Unsupported platform' });
    }
  } else if (request.type === 'STOP_MONITORING') {
    isActive = false;
    processedMessages.clear();
    sendResponse({ success: true });
  } else if (request.type === 'GET_STATUS') {
    sendResponse({
      isActive,
      platform: detectPlatform(),
      messageCount: processedMessages.size,
    });
  }

  return true; // Keep message channel open for async response
});

// Auto-start if already configured
chrome.storage.local.get(['autoStart', 'apiEndpoint', 'authToken'], (data) => {
  if (data.autoStart && data.apiEndpoint && data.authToken) {
    const platform = detectPlatform();
    if (platform) {
      isActive = true;
      apiEndpoint = data.apiEndpoint;
      authToken = data.authToken;
      console.log('[DealFlow] Auto-starting monitor...');
      startMonitoring(platform);
    }
  }
});
