// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleFeature') {
    const isEnabled = request.enabled;
    // Store the global state for the extension
    chrome.storage.local.set({ 'featureEnabled': isEnabled });

    // If you are controlling content scripts, you can send a message to the content script
    // or re-inject/remove it as needed.
    // For example, to toggle on a specific tab:
      if (isEnabled) {
        chrome.scripting.executeScript({
          files: ['content_script.js']
        });
      } else {
        chrome.scripting.removeCSS({
          files: ['content_styles.css']
        });
        // Potentially send a message to the content script to clean itself up
      }
    
  }
});