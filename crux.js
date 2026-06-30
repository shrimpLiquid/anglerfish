document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('Button');
  
  btn.addEventListener('click', async function() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const repsData = default_reps; 

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      // FIX: Add default_reps parameter here so the function can receive repsData
      func: ((default_reps) => { 
        let isReplacementEnabled = true;

        chrome.storage.local.get("isEnabled", (data) => {
            isReplacementEnabled = data.isEnabled !== false;
            if (isReplacementEnabled) replaceText(document.documentElement);
        });
        alert("goop")

        const reps = Object.entries(default_reps);

        // Cache compiled regex batches and a map for O(1) lookups globally
        const regexBatches = [];
        const repMap = new Map();

        for (let i = 0; i < reps.length; i += 500) {
          const batch = reps.slice(i, i + 500);
          const regex = new RegExp(
            "\\b(" + batch.map(([key]) => {
              repMap.set(key.toLowerCase(), batch.find(([k]) => k === key)[1]);
              return key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }).join("|") + ")\\b",
            "gi"
          );
          regexBatches.push(regex);
        }

        // Single global regex for attributes and JSON to apply all reps dynamically
        const dynamicGlobalRegex = new RegExp(
          "\\b(" + reps.map(([key]) => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|") + ")\\b",
          "gi"
        );

        function dynamicReplacer(match) {
          const rep = repMap.get(match.toLowerCase());
          if (!rep) return match;
          return match[0] === match[0]?.toUpperCase()
            ? rep.charAt(0).toUpperCase() + rep.slice(1)
            : rep;
        }

        function replaceText(rootNode) {
          if (!rootNode) return;

          // 1. Scan text nodes using TreeWalker
          const walker = document.createTreeWalker(
            rootNode,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                const parent = node.parentNode;
                if (!parent) return NodeFilter.FILTER_REJECT;
                const tag = parent.tagName;
                if (tag === "SCRIPT" || tag === "STYLE" || tag === "INPUT" || tag === "TEXTAREA" || parent.isContentEditable) {
                  return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
              }
            }
          );

          let textNode;
          while ((textNode = walker.nextNode())) {
            let oldText = textNode.textContent;
            let newText = oldText;

            for (const regex of regexBatches) {
              newText = newText.replace(regex, dynamicReplacer);
            }

            if (oldText !== newText) {
              textNode.textContent = newText;
            }
          }

          // 2. Scan attributes dynamically
          if (rootNode.attributes) handleAttributes(rootNode);
          const elements = rootNode.querySelectorAll?.("*") || [];
          elements.forEach(node => {
            const tag = node.tagName;
            if (tag === "SCRIPT" || tag === "STYLE" || tag === "INPUT" || tag === "TEXTAREA" || node.isContentEditable) return;
            handleAttributes(node);
          });
        }

        function handleAttributes(node) {
          if (!node.attributes) return;
          for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            // Only modify user-visible text attributes to protect layout styles/classes
            if (/^(title|alt|placeholder)$/i.test(attr.name)) {
              let oldAttr = attr.value;
              let newAttr = oldAttr.replace(dynamicGlobalRegex, dynamicReplacer);

              if (oldAttr !== newAttr) {
                attr.value = newAttr;
              }
            }
          }
        }

        // 3. MutationObserver
        const observer = new MutationObserver((mutations) => {
          if (!isReplacementEnabled) return;
          
          mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                replaceText(node);
              }
            });
          });
        });

        observer.observe(document.documentElement, { childList: true, subtree: true });

        // 4. JSON intercept dynamically
        const originalParse = JSON.parse;
        JSON.parse = function (...args) {
          try {
            const result = originalParse.apply(this, args);
            const jsonString = JSON.stringify(result);
            const modifiedJsonString = jsonString.replace(dynamicGlobalRegex, dynamicReplacer);
            return jsonString !== modifiedJsonString ? originalParse(modifiedJsonString) : result;
          } catch (error) {
            return originalParse.apply(this, args);
          }
        };

        chrome.runtime.onMessage.addListener((message) => {
          if (message.type === "TOGGLE_STATE") {
            isReplacementEnabled = message.state;
            if (isReplacementEnabled) replaceText(document.documentElement);
          }
        });
      }), 
      args: [repsData]     
    });
  });
});