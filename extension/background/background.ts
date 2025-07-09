chrome.runtime.onInstalled.addListener(() => {
  console.log("UpGenie extension installed ✅");

  chrome.storage.local.get(["usedToday"]).then((res) => {
    if (typeof res.usedToday === "undefined") {
      chrome.storage.local.set({ usedToday: 0 });
    }
  });

  chrome.storage.local.get(["bio"]).then((res) => {
    chrome.storage.local.set({
      bio: res.bio || "",
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const asyncHandler = async () => {
    switch (message.type) {
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

      case "getSessionToken": {
        chrome.cookies.get(
          {
            url: "https://upgenie.online",
            name: "__Secure-next-auth.session-token",
          },
          function (cookie) {
            if (cookie) {
              const token = cookie.value;

              chrome.storage.local.set({ token }, () => {
                console.log("The token is saved in chrome.storage.local");
              });

              sendResponse({ token });
            } else {
              sendResponse({ error: "No token found" });
            }
          }
        );

        return true;
      }

      default:
        console.warn("Unknown message type:", message.type);
        sendResponse({ error: "Unknown message type" });
    }
  };

  asyncHandler();
  return true;
});
