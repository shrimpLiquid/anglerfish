//import { default_reps } from "./default_reps.js";
const reps = Object.entries(default_reps);

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
  for (let i = 0; i < reps.length; i += 500) { // batches of 500 keys
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
function walkAndReplace() {
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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", walkAndReplace);
} else {
  walkAndReplace();
}




function processNode(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  let node;
  while (node = walker.nextNode()) {
    replaceTextNode(node);
  }
}

function processAllMessages() {
  document.querySelectorAll("[class*='messageContent']").forEach(el => processNode(el));
}

// Run initially
processAllMessages();

// Observe for new messages
const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === 1) {
        if (node.matches("[class*='messageContent']")) {
          processNode(node);
        } else {
          node.querySelectorAll?.("[class*='messageContent']").forEach(el => processNode(el));
        }
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
