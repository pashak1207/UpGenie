chrome.runtime.onInstalled.addListener(() => {
  console.info("✅ UpGenie extension installed");

  chrome.storage.local.get(["usedToday", "bio"]).then((res) => {
    const updates: Record<string, any> = {};

    if (typeof res.usedToday === "undefined") {
      updates.usedToday = 0;
    }

    if (typeof res.bio !== "string") {
      updates.bio = "";
    }

    if (Object.keys(updates).length > 0) {
      chrome.storage.local.set(updates);
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message?.type) {
    sendResponse({ error: "Missing message type" });
    return false;
  }

  const handlers: Record<string, () => Promise<void>> = {
    trackUsage: async () => {
      const { usedToday = 0 } = await chrome.storage.local.get("usedToday");
      const newCount = usedToday + 1;
      await chrome.storage.local.set({ usedToday: newCount });
      sendResponse({ usedToday: newCount });
    },

    resetUsage: async () => {
      await chrome.storage.local.set({ usedToday: 0 });
      sendResponse({ success: true });
    },

    getSessionToken: async () => {
      chrome.cookies.get(
        {
          url: "https://upgenie.online",
          name: "__Secure-next-auth.session-token",
        },
        (cookie) => {
          if (cookie?.value) {
            chrome.storage.local.set({ token: cookie.value }, () => {
              console.info("✅ Token saved to chrome.storage.local");
            });
            sendResponse({ token: cookie.value });
          } else {
            sendResponse({ error: "No token found" });
          }
        }
      );
    },
  };

  const handler = handlers[message.type];

  if (handler) {
    handler();
    return true; // Keep the message channel open for async `sendResponse`
  } else {
    console.warn("⚠️ Unknown message type:", message.type);
    sendResponse({ error: "Unknown message type" });
    return false;
  }
});
