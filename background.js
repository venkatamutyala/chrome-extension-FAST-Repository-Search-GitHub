// Background service worker for GitHub Repo Search extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('GitHub Repo Search extension installed');
  
  // Log available commands for debugging
  chrome.commands.getAll((commands) => {
    console.log('Registered commands:', commands);
  });
});

// Handle keyboard command
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
  if (command === '_execute_action') {
    // This command automatically opens the popup
    // No additional action needed
    console.log('Keyboard shortcut triggered - opening popup');
  }
});

// Optional: Listen for messages from popup or options page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'clearCache') {
    chrome.storage.local.remove(['cachedRepos', 'cacheTimestamp'], () => {
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  }
});
