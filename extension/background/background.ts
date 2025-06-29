chrome.runtime.onInstalled.addListener(() => {
  console.log("UpGenie extension installed ✅");

  chrome.storage.local.get(["usedToday"]).then((res) => {
    if (typeof res.usedToday === "undefined") {
      chrome.storage.local.set({ usedToday: 0 });
    }
  });

  chrome.storage.local.get(["bio", "autoGenerate"]).then((res) => {
    chrome.storage.local.set({
      bio: res.bio || "",
      autoGenerate: res.autoGenerate ?? false,
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const asyncHandler = async () => {
    switch (message.type) {
      case "getUserToken": {
        const { userToken } = await chrome.storage.local.get("userToken");
        sendResponse({ token: userToken });
        break;
      }

      case "trackUsage": {
        const { usedToday } = await chrome.storage.local.get("usedToday");
        const newCount = (usedToday || 0) + 1;
        await chrome.storage.local.set({ usedToday: newCount });
        sendResponse({ usedToday: newCount });
        break;
      }

      case "resetUsage": {
        await chrome.storage.local.set({ usedToday: 0 });
        sendResponse({ success: true });
        break;
      }

      case "getSettings": {
        const settings = await chrome.storage.local.get([
          "bio",
          "autoGenerate",
          "userToken",
          "usedToday",
        ]);
        sendResponse({ settings });
        break;
      }

      default:
        console.warn("Unknown message type:", message.type);
        sendResponse({ error: "Unknown message type" });
    }
  };

  asyncHandler();
  return true;
});
