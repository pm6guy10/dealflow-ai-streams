// DealFlow Background Service Worker
console.log('[DealFlow] Background service worker loaded');

// Listen for sale detection notifications
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SALE_DETECTED') {
    console.log('[DealFlow] Sale detected:', request.data);

    // Show browser notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: '🎉 Sale Detected!',
      message: `${request.data.username} wants to buy! (${Math.round(request.data.confidence * 100)}% confidence)`,
      priority: 2,
    });

    // Play sound (if enabled)
    chrome.storage.local.get(['soundEnabled'], (data) => {
      if (data.soundEnabled !== false) {
        // Browser will play default notification sound
        console.log('[DealFlow] Notification sound played');
      }
    });
  }

  sendResponse({ received: true });
  return true;
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('[DealFlow] Extension icon clicked');
  // Opens popup.html automatically
});
