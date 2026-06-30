const toggleButton = document.getElementById("toggle");

// Initialize button state
chrome.storage.local.get("isEnabled", (data) => {
  const isEnabled = data.isEnabled !== false; // Default to true
  updateButton(isEnabled);
});

// Update button text and color
const updateButton = (isEnabled) => {
  toggleButton.innerText = `Replacement: ${isEnabled ? "ON" : "OFF"}`;
  toggleButton.style.backgroundColor = isEnabled ? "#ff4d4d" : "#888";
};

// Toggle handler
toggleButton.addEventListener("click", () => {
  chrome.storage.local.get("isEnabled", (data) => {
    const newState = !(data.isEnabled !== false);
    chrome.storage.local.set({ isEnabled: newState }, () => {
      updateButton(newState);
      // Notify content script of state change
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: updateReplacementState,
          args: [newState]
        });
      });
    });
  });
});

// Function to send to content script
function updateReplacementState(isEnabled) {
  window.isReplacementEnabled = isEnabled;
  if (isEnabled) replaceText();
}
