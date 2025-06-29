const waitForTextarea = async (): Promise<HTMLTextAreaElement> => {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const textarea = document.querySelector(
        'textarea[name="coverLetter"]'
      ) as HTMLTextAreaElement;
      if (textarea) {
        clearInterval(interval);
        resolve(textarea);
      }
    }, 500);
  });
};

const insertGenieButton = (textarea: HTMLTextAreaElement) => {
  const btn = document.createElement("button");
  btn.textContent = "✨ UpGenie";
  btn.style.marginTop = "8px";
  btn.style.padding = "6px 12px";
  btn.style.fontSize = "13px";
  btn.style.border = "none";
  btn.style.borderRadius = "4px";
  btn.style.background = "#10a37f";
  btn.style.color = "white";
  btn.style.cursor = "pointer";

  textarea.parentElement?.appendChild(btn);

  btn.addEventListener("click", async () => {
    const jobText = document.body.innerText.slice(0, 2000);
    const settings = await chrome.storage.local.get(["bio", "userToken"]);

    const response = await fetch("https://api.upgenie.ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.userToken}`,
      },
      body: JSON.stringify({
        jobText,
        bio: settings.bio,
      }),
    });

    const data = await response.json();
    const result = data.result?.trim() || "";

    textarea.value = result;
  });
};

waitForTextarea().then(insertGenieButton);
