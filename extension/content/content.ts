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

const waitForContentExpansion = (
  selector: string,
  timeout = 5000
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const el = document.querySelector(selector);
      if (el?.textContent?.length && el.textContent.length > 100) {
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
  const moreBtn = document.querySelector<HTMLButtonElement>(
    ".fe-job-details .air3-truncation-btn"
  );
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
      .querySelector("[data-cy='expertise'] + strong")
      ?.textContent?.trim() || "";

  parsedJobText = content;
  return { title, content, level };
};

const insertGenieButton = async (textarea: HTMLTextAreaElement) => {
  if (genieButton) return;

  genieButton = document.createElement("button");
  genieButton.textContent = "✨ UpGenie";
  Object.assign(genieButton.style, {
    marginTop: "8px",
    marginBottom: "32px",
    padding: "6px 12px",
    fontSize: "13px",
    border: "none",
    borderRadius: "4px",
    background: "#10a37f",
    color: "white",
    cursor: "pointer",
  });

  textarea.parentElement?.parentElement?.appendChild(genieButton);

  genieButton.addEventListener("click", async () => {
    const originalText = genieButton!.textContent;
    genieButton!.textContent = "⏳ Generating...";
    genieButton!.disabled = true;
    genieButton!.style.opacity = "0.6";

    try {
      const {
        bio,
        token,
        usedCount = 0,
        feedbackGiven = false,
      } = await chrome.storage.local.get([
        "bio",
        "token",
        "usedCount",
        "feedbackGiven",
      ]);

      // Placeholder for actual generation
      // const response = await fetch("https://api.upgenie.ai/generate", { ... })
      // const data = await response.json();
      // textarea.value = data.result?.trim() || "";

      await chrome.storage.local.set({ usedCount: usedCount + 1 });

      // if (usedCount + 1 === 5 && !feedbackGiven) {
      if (false) {
        showFeedbackPrompt(async (feedback) => {
          try {
            await fetch("https://api.upgenie.ai/feedback", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ feedback }),
            });

            await chrome.storage.local.set({
              uses_left: usedCount + 3,
              feedbackGiven: true,
            });
          } catch (err) {
            console.error("❌ Failed to send feedback:", err);
          }
        });
      }
    } catch (err) {
      console.error("❌ Error generating proposal:", err);
    } finally {
      genieButton!.textContent = originalText;
      genieButton!.disabled = false;
      genieButton!.style.opacity = "1";
    }
  });
};

const observeJobDetails = () => {
  const observer = new MutationObserver(async () => {
    const jobContainer = document.querySelector(".fe-job-details");
    if (jobContainer && !genieButton) {
      try {
        const parsed = await parseJob();
        if (parsed.title && parsed.content) {
          const textarea = (await waitForElement(
            ".cover-letter-area .textarea-wrapper textarea.air3-textarea"
          )) as HTMLTextAreaElement;
          await insertGenieButton(textarea);
        }
      } catch (err) {
        console.warn("⚠️ Failed to parse job:", err);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

observeJobDetails();

const showFeedbackPrompt = (onSubmit: (feedback: string) => void) => {
  if (document.getElementById("upgenie-feedback-modal")) return;

  const modalCont = document.createElement("div");
  modalCont.id = "upgenie-feedback-modal-cont";
  modalCont.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 999999;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const modal = document.createElement("div");
  modal.id = "upgenie-feedback-modal";
  modal.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    width: 320px;
    font-family: sans-serif;
  `;

  modal.innerHTML = `
    <h3 style="margin-top: 0; text-align: center;">We'd love your feedback! 💬</h3>
    <p style="font-size: 14px; text-align: center;">Tell us what you think and get <b>2 bonus uses</b>.</p>
    <textarea placeholder="Your feedback..." style="width: 100%; height: 80px; margin-top: 10px; padding: 8px; border-radius: 6px; border: 1px solid #ccc; resize: vertical;"></textarea>
    <div style="text-align: right; margin-top: 12px;">
      <button id="upgenie-feedback-cancel" style="margin-right: 8px;">Cancel</button>
      <button id="upgenie-feedback-submit" style="background-color: #10a37f; color: white; border: none; padding: 6px 12px; border-radius: 4px;">Submit</button>
    </div>
  `;

  modalCont.appendChild(modal);
  document.body.appendChild(modalCont);

  modal
    .querySelector("#upgenie-feedback-cancel")
    ?.addEventListener("click", () => modalCont.remove());
  modal
    .querySelector("#upgenie-feedback-submit")
    ?.addEventListener("click", () => {
      const feedback = (
        modal.querySelector("textarea") as HTMLTextAreaElement
      ).value.trim();
      if (feedback) {
        modalCont.remove();
        onSubmit(feedback);
      }
    });
};
