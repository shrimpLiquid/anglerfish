function inverse(obj){
  var retobj = {};
  for(var key in obj){
    retobj[obj[key]] = key;
  }
  return retobj;
}

//import { default_reps } from "./default_reps.js";
freaky_reps = inverse(default_reps)


    const changes = Object.entries(freaky_reps);
// NOTE: 'freaky_reps' must be defined globally or imported elsewhere for this code to run.

function buildRegexBatch(entries) {
    return new RegExp(
        "\\b(" + entries.map(([key]) =>
            key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        ).join("|") + ")\\b",
        "gi"
    );
}

// The main logic is now inside an async function to be called on DOMContentLoaded
async function performReplacementOnSelection() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
        try {
            // 1. Get the selected text from the active tab
            const [{ result: selectedText }] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => window.getSelection().toString(),
            });

            // Check if text was actually selected
            if (!selectedText) {
                document.getElementById('selectedTextDisplay').textContent = 'No text was selected.';
                document.getElementById('trasn').textContent = 'N/A';
                console.log('No text selected.');
                return; // Stop here if nothing is selected
            }
            
            console.log('Selected Text:', selectedText);
            
            let replacedText = selectedText; // Start replacement process with the selected text

            // 2. Perform batched replacement
            for (let i = 0; i < changes.length; i += 500) { // batches of 500 keys
                const batch = changes.slice(i, i + 500);
                const regex = buildRegexBatch(batch);
                
                // Use the string.replace result to update replacedText
                replacedText = replacedText.replace(regex, match => {
                    // Find the replacement value, case-insensitively
                    const replacementEntry = batch.find(([key]) => key.toLowerCase() === match.toLowerCase());
                    
                    if (replacementEntry) {
                        const rep = replacementEntry[1];
                        // Preserve the case of the first letter if the match was capitalized
                        return match[0] === match[0]?.toUpperCase()
                            ? rep.charAt(0).toUpperCase() + rep.slice(1)
                            : rep;
                    }
                    return match; // Return the original match if no replacement is found (shouldn't happen with the regex setup, but good practice)
                });
            }

            // 3. Display the results
            // Display the original selected text
            document.getElementById('selectedTextDisplay').textContent = ""; 
            // Display the result of the replacement
            document.getElementById('trasn').textContent = replacedText; 

        } catch (e) {
            document.getElementById('selectedTextDisplay').textContent = 'D:';
            document.getElementById('trasn').textContent = 'Error';
        }
    }
}

// Execute the main function once the popup/document is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    performReplacementOnSelection();
});
