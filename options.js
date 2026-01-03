// DOM elements
const organizationsTextarea = document.getElementById('organizations');
const tokenInput = document.getElementById('token');
const cacheMinutesSelect = document.getElementById('cacheMinutes');
const saveBtn = document.getElementById('saveBtn');
const clearCacheBtn = document.getElementById('clearCacheBtn');
const statusMessage = document.getElementById('statusMessage');

// Load saved settings
async function loadSettings() {
  const result = await chrome.storage.sync.get({
    organizations: [],
    token: '',
    cacheMinutes: 15
  });
  
  organizationsTextarea.value = result.organizations.join('\n');
  tokenInput.value = result.token;
  cacheMinutesSelect.value = result.cacheMinutes.toString();
}

// Save settings
async function saveSettings() {
  console.log('saveSettings called');
  const organizations = organizationsTextarea.value
    .split('\n')
    .map(org => org.trim())
    .filter(org => org.length > 0);
  
  const token = tokenInput.value.trim();
  const cacheMinutes = parseInt(cacheMinutesSelect.value);
  
  console.log('Organizations:', organizations);
  console.log('Token:', token ? '(set)' : '(not set)');
  console.log('Cache minutes:', cacheMinutes);
  
  if (organizations.length === 0) {
    showStatus('Please enter at least one organization', 'error');
    return;
  }
  
  try {
    await chrome.storage.sync.set({
      organizations,
      token,
      cacheMinutes
    });
    
    console.log('Settings saved to chrome.storage.sync');
    
    // Clear cache when settings change to force refresh
    await chrome.storage.local.remove(['cachedRepos', 'cacheTimestamp']);
    
    console.log('Cache cleared');
    
    showStatus('Settings saved successfully! Close this tab and reopen the extension.', 'success');
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      hideStatus();
    }, 5000);
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus(`Error saving settings: ${error.message}`, 'error');
  }
}

// Clear cache
async function clearCache() {
  try {
    await chrome.storage.local.remove(['cachedRepos', 'cacheTimestamp']);
    showStatus('Cache cleared successfully!', 'success');
    
    setTimeout(() => {
      hideStatus();
    }, 3000);
  } catch (error) {
    showStatus(`Error clearing cache: ${error.message}`, 'error');
  }
}

// Show status message
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
}

// Hide status message
function hideStatus() {
  statusMessage.className = 'status-message';
}

// Event listeners
saveBtn.addEventListener('click', saveSettings);
clearCacheBtn.addEventListener('click', clearCache);

// Load settings on page load
loadSettings();

// Save on Enter key in text fields
tokenInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveSettings();
  }
});
