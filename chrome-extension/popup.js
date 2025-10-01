// DealFlow Popup Script
const API_ENDPOINT = 'https://piqmyciivlcfxmcopeqk.supabase.co';

// DOM elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const platformText = document.getElementById('platformText');
const messageCount = document.getElementById('messageCount');
const authTokenInput = document.getElementById('authToken');
const autoStartCheckbox = document.getElementById('autoStart');
const soundEnabledCheckbox = document.getElementById('soundEnabled');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const saveBtn = document.getElementById('saveBtn');
const messageDiv = document.getElementById('message');

// Load saved settings
chrome.storage.local.get(
  ['authToken', 'autoStart', 'soundEnabled'],
  (data) => {
    if (data.authToken) authTokenInput.value = data.authToken;
    if (data.autoStart) autoStartCheckbox.checked = data.autoStart;
    if (data.soundEnabled !== undefined) soundEnabledCheckbox.checked = data.soundEnabled;
  }
);

// Show message
function showMessage(text, type = 'success') {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.classList.remove('hidden');
  setTimeout(() => messageDiv.classList.add('hidden'), 3000);
}

// Update status display
async function updateStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { type: 'GET_STATUS' }, (response) => {
      if (chrome.runtime.lastError) {
        statusText.textContent = 'Not on a stream page';
        platformText.textContent = '-';
        messageCount.textContent = '0';
        statusIndicator.classList.remove('active');
        statusIndicator.classList.add('inactive');
        return;
      }

      if (response) {
        if (response.isActive) {
          statusText.textContent = 'Active';
          statusIndicator.classList.add('active');
          statusIndicator.classList.remove('inactive');
          startBtn.classList.add('hidden');
          stopBtn.classList.remove('hidden');
        } else {
          statusText.textContent = 'Inactive';
          statusIndicator.classList.remove('active');
          statusIndicator.classList.add('inactive');
          startBtn.classList.remove('hidden');
          stopBtn.classList.add('hidden');
        }

        platformText.textContent = response.platform || '-';
        messageCount.textContent = response.messageCount || 0;
      }
    });
  } catch (error) {
    console.error('Error updating status:', error);
  }
}

// Start monitoring
startBtn.addEventListener('click', async () => {
  const authToken = authTokenInput.value.trim();
  
  if (!authToken) {
    showMessage('Please enter your auth token first', 'error');
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Start a new stream session
    const response = await fetch(`${API_ENDPOINT}/functions/v1/verify-extension`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'start_session' }),
    });

    if (!response.ok) {
      throw new Error('Failed to start session');
    }

    const { stream_session_id } = await response.json();

    chrome.tabs.sendMessage(
      tab.id,
      {
        type: 'START_MONITORING',
        streamSessionId: stream_session_id,
        apiEndpoint: API_ENDPOINT,
        authToken: authToken,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          showMessage('Error: Not on a supported platform', 'error');
          return;
        }

        if (response.success) {
          showMessage(`Started monitoring ${response.platform}!`, 'success');
          updateStatus();
        } else {
          showMessage(response.error || 'Failed to start monitoring', 'error');
        }
      }
    );
  } catch (error) {
    console.error('Error starting monitoring:', error);
    showMessage('Error starting monitoring', 'error');
  }
});

// Stop monitoring
stopBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, { type: 'STOP_MONITORING' }, (response) => {
    if (response?.success) {
      showMessage('Monitoring stopped', 'success');
      updateStatus();
    }
  });
});

// Save settings
saveBtn.addEventListener('click', () => {
  const authToken = authTokenInput.value.trim();
  const autoStart = autoStartCheckbox.checked;
  const soundEnabled = soundEnabledCheckbox.checked;

  chrome.storage.local.set(
    {
      authToken,
      autoStart,
      soundEnabled,
      apiEndpoint: API_ENDPOINT,
    },
    () => {
      showMessage('Settings saved!', 'success');
    }
  );
});

// Update status on load
updateStatus();

// Update status every 2 seconds
setInterval(updateStatus, 2000);
