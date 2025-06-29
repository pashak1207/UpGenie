let genieButton: HTMLButtonElement | null = null;
let parsedJobText = "";

interface IParseContent {
  title: string;
  content: string;
  level?: string;
}

const waitForElement = (
  selector: string,
  timeout = 10000
): Promise<Element> => {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(interval);
        resolve(el);
      }
    }, 300);

    setTimeout(() => {
      clearInterval(interval);
      reject(`Timeout: ${selector} not found`);
    }, timeout);
  });
};

const waitForContentExpansion = async (
  selector: string,
  timeout = 5000
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const interval = setInterval(() => {
      const el = document.querySelector(selector);
      if (el && el.textContent && el.textContent.length > 100) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject(`Timeout: content not expanded in ${timeout}ms`);
      }
    }, 200);
  });
};

const parseJob = async (): Promise<IParseContent> => {
  const moreBtn = document.querySelector(
    ".fe-job-details .air3-truncation-btn"
  ) as HTMLButtonElement;

  if (moreBtn) {
    moreBtn.click();
    await waitForContentExpansion("#air3-truncation-1");
  }

  const title =
    document
      .querySelector(".fe-job-details .content h3")
      ?.textContent?.trim() || "";

  const content =
    document.querySelector("#air3-truncation-1")?.textContent?.trim() || "";

  const level =
    document
      .querySelector(
        ".fe-job-details .air3-card-section .sidebar .fe-ui-job-features [data-cy='expertise'] + strong"
      )
      ?.textContent?.trim() || "";

  return {
    title,
    content,
    level,
  };
};

const insertGenieButton = async (textarea: HTMLTextAreaElement) => {
  const formGroup = document.querySelector(
    ".additional-details .form-group"
  ) as HTMLDivElement;

  if (formGroup) {
    formGroup.style.textAlign = "right";
  }

  if (genieButton) return;

  genieButton = document.createElement("button");
  genieButton.textContent = "✨ UpGenie";
  genieButton.style.marginTop = "8px";
  genieButton.style.marginBottom = "32px";
  genieButton.style.padding = "6px 12px";
  genieButton.style.fontSize = "13px";
  genieButton.style.border = "none";
  genieButton.style.borderRadius = "4px";
  genieButton.style.background = "#10a37f";
  genieButton.style.color = "white";
  genieButton.style.cursor = "pointer";

  textarea.parentElement?.parentElement?.appendChild(genieButton);

  genieButton.addEventListener("click", async () => {
    if (!genieButton) return;

    const originalText = genieButton.textContent;
    genieButton.textContent = "⏳ Generating...";
    genieButton.disabled = true;
    genieButton.style.opacity = "0.6";

    try {
      const settings = await chrome.storage.local.get(["bio", "userToken"]);

      // const response = await fetch("https://api.upgenie.ai/generate", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${settings.userToken}`,
      //   },
      //   body: JSON.stringify({
      //     jobText: parsedJobText,
      //     bio: settings.bio,
      //   }),
      // });

      // const data = await response.json();
      // const result = data.result?.trim() || "";
      // textarea.value = result;
    } catch (err) {
      console.error("❌ Error generating proposal:", err);
    } finally {
      genieButton.textContent = originalText;
      genieButton.disabled = false;
      genieButton.style.opacity = "1";
    }
  });
};

let isJobVisible = false;

const observeJobDetails = () => {
  const root = document.body;

  const observer = new MutationObserver(async () => {
    const jobContainer = document.querySelector(".fe-job-details");

    if (jobContainer && !isJobVisible) {
      isJobVisible = true;

      try {
        const parsed = await parseJob();

        if (parsed.title && parsed.content) {
          const textarea = (await waitForElement(
            ".cover-letter-area .textarea-wrapper textarea.air3-textarea"
          )) as HTMLTextAreaElement;

          await insertGenieButton(textarea);
        } else {
          console.warn(
            "⚠️ Missing title or content. Skipping button insertion."
          );
        }
      } catch (err) {
        console.warn("⚠️ Failed to parse job:", err);
      }
    }

    if (!jobContainer && isJobVisible) {
      isJobVisible = false;
      console.log("🔴 Job details panel closed");
    }
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
  });
};
observeJobDetails();
