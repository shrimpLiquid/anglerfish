
document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('Button');
  
  btn.addEventListener('click', async function() {
    
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    
    const repsData = default_reps; 

    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: replaceOnPage, 
      args: [repsData]     
    });
  });
});


function replaceOnPage(repsData) {
  const reps = Object.entries(repsData);

  function buildRegexBatch(entries) {
    return new RegExp(
      "\\b(" + entries.map(([key]) =>
        key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      ).join("|") + ")\\b",
      "gi"
    );
  }

  function replaceTextNode(node) {
    let text = node.nodeValue;
    for (let i = 0; i < reps.length; i += 500) {
      const batch = reps.slice(i, i + 500);
      const regex = buildRegexBatch(batch);
      text = text.replace(regex, match => {
        const rep = batch.find(([key]) => key.toLowerCase() === match.toLowerCase())[1];
        return match[0] === match[0]?.toUpperCase()
          ? rep.charAt(0).toUpperCase() + rep.slice(1)
          : rep;
      });
    }
    node.nodeValue = text;
  }

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: node => {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentNode && ["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"].includes(node.parentNode.nodeName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let node;
  while (node = walker.nextNode()) {
    replaceTextNode(node);
  }
}
