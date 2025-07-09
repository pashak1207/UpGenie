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
      const settings = await chrome.storage.local.get([
        "bio",
        "token",
        "usedCount",
        "feedbackGiven",
      ]);

      const usedCount = settings.usedCount || 0;
      const feedbackGiven = settings.feedbackGiven || false;

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

      const newCount = usedCount + 1;
      await chrome.storage.local.set({ usedCount: newCount });

      if (newCount === 5 && !feedbackGiven) {
        showFeedbackPrompt(async (feedback: string) => {
          try {
            await fetch("https://api.upgenie.ai/feedback", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${settings.userToken}`,
              },
              body: JSON.stringify({ feedback }),
            });

            await chrome.storage.local.set({
              uses_left: newCount + 2,
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

function showFeedbackPrompt(onSubmit: (feedback: string) => void) {
  const existingModal = document.getElementById("upgenie-feedback-modal");
  if (existingModal) return;

  const modalCont = document.createElement("div");
  modalCont.id = "upgenie-feedback-modal-cont";
  modalCont.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 999999;
    background: rgba(0, 0, 0, 0.6);
    padding: 20px;
    width: 100%;
    height: 100%;
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
    font-family: "Neue Montreal", sans-serif;
  `;

  modal.innerHTML = `
    <h3 style="margin-top: 0; text-align: center;">We'd love your feedback! 💬</h3>
    <p style="font-size: 14px; text-align: center;">Tell us what you think and get <b>2 bonus uses</b> as a thank you.</p>
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
    ?.addEventListener("click", () => {
      modalCont.remove();
    });

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
}
