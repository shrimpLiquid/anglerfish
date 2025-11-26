// popup.js or options.js
const toggle = document.getElementById('featureToggle');

// Load the initial state from storage
chrome.storage.local.get(['featureEnabled'], function(result) {
  toggle.checked = result.featureEnabled === true; // Default to true if not set
});

toggle.addEventListener('change', function() {
  const isEnabled = toggle.checked;
  chrome.storage.local.set({ 'featureEnabled': isEnabled });
  // Optionally, send a message to the background script to update active tabs
  chrome.runtime.sendMessage({ action: 'toggleFeature', enabled: isEnabled });
});