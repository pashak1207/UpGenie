import "./popup.scss";

document.addEventListener("DOMContentLoaded", async () => {
  window.addEventListener("message", (event) => {
    const { type, token } = event.data || {};

    if (type === "token" && token) {
      chrome.storage.local.set({ token }, () => {
        document.body.classList.add("logged");
      });
    }
  });

  const data = await chrome.storage.local.get([
    "bio",
    "token",
    "name",
    "githubUsername",
  ]);
  const textarea = document.getElementById("bio") as HTMLTextAreaElement;
  const loginBtn = document.getElementById("login") as HTMLButtonElement;
  const logoutBtn = document.getElementById("logout") as HTMLButtonElement;
  const githubInput = document.getElementById("github") as HTMLInputElement;
  const nameInput = document.getElementById("name") as HTMLInputElement;

  if (data.bio) textarea.value = data.bio;
  if (data.githubUsername) githubInput.value = data.githubUsername;
  if (data.name) nameInput.value = data.name;

  if (!data.token) {
    document.body.classList.remove("logged");
  } else {
    document.body.classList.add("logged");
  }

  textarea?.addEventListener("input", async (e: any) => {
    const value = e?.target?.value;
    await chrome.storage.local.set({ bio: value });
  });

  nameInput?.addEventListener("input", async (e: any) => {
    const value = e?.target?.value;
    await chrome.storage.local.set({ name: value });
  });

  loginBtn?.addEventListener("click", () => {
    const popup = window.open(
      "https://upgenie.online/sign-in?popup=1",
      "_blank",
      "width=500,height=600"
    );

    if (!popup) {
      console.error("❌ Popup blocked or failed to open.");
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    await chrome.storage.local.remove("token");

    document.body.classList.remove("logged");
  });

  const validationMessage = document.getElementById(
    "githubValidation"
  ) as HTMLParagraphElement;

  let debounceTimer: number;

  githubInput?.addEventListener("input", async () => {
    clearTimeout(debounceTimer);

    const username = githubInput.value.trim();

    if (!username) {
      validationMessage.textContent = "";
      await chrome.storage.local.set({ githubUsername: "" });
      return;
    }

    debounceTimer = window.setTimeout(async () => {
      validationMessage.textContent = "⏳ Checking...";
      try {
        const res = await fetch(
          `https://api.github.com/users/${username}/repos`
        );

        if (!res.ok) {
          const errorData = await res.json();
          validationMessage.textContent = `❌ ${errorData.message}`;
          return;
        }

        const repos = await res.json();
        if (repos.length === 0) {
          validationMessage.textContent = "⚠️ No public repositories found";
        } else {
          validationMessage.textContent = "";
        }

        await chrome.storage.local.set({ githubUsername: username });
      } catch (err: any) {
        validationMessage.textContent = "⚠️ Network error";
      }
    }, 600);
  });
});
