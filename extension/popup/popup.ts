import { fetchWithAuth } from "../utils/fetchWithAuth";
import "./popup.scss";

document.addEventListener("DOMContentLoaded", async () => {
  const textarea = document.getElementById("bio") as HTMLTextAreaElement | null;
  const loginBtn = document.getElementById("login") as HTMLButtonElement | null;
  const logoutBtn = document.getElementById(
    "logout"
  ) as HTMLButtonElement | null;
  const githubInput = document.getElementById(
    "github"
  ) as HTMLInputElement | null;
  const nameInput = document.getElementById("name") as HTMLInputElement | null;
  const validationMessage = document.getElementById(
    "githubValidation"
  ) as HTMLParagraphElement | null;

  // 1. Get token from popup message
  window.addEventListener("message", (event) => {
    const { type, token } = event.data || {};
    if (type === "token" && token) {
      chrome.storage.local.set({ token }, () => {
        document.body.classList.add("logged");
      });
    }
  });

  // 2. Init
  const { token } = await chrome.storage.local.get("token");

  if (token) {
    document.body.classList.add("logged");

    try {
      const userData = await fetchWithAuth("https://upgenie.online/api/me");

      if (textarea) textarea.value = userData.bio || "";
      if (nameInput) nameInput.value = userData.name || "";
      if (githubInput) githubInput.value = userData.githubUsername || "";

      chrome.storage.local.set({
        bio: userData.bio || "",
        name: userData.name || "",
        githubUsername: userData.githubUsername || "",
      });
    } catch (err) {
      console.error("❌ Failed to load user data:", err);
    }
  } else {
    document.body.classList.remove("logged");
  }

  function saveFieldToServer(field: string, value: string) {
    fetchWithAuth("https://upgenie.online/api/me", {
      method: "PUT",
      body: JSON.stringify({ [field]: value }),
    }).catch((err) => {
      console.error(`❌ Failed to save ${field}:`, err);
    });
  }

  // 3. Inputs handlers
  textarea?.addEventListener("input", (e) => {
    const bio = (e.target as HTMLTextAreaElement).value;
    chrome.storage.local.set({ bio });
    saveFieldToServer("bio", bio);
  });

  nameInput?.addEventListener("input", (e) => {
    const name = (e.target as HTMLInputElement).value;
    chrome.storage.local.set({ name });
    saveFieldToServer("name", name);
  });

  githubInput?.addEventListener("input", () => {
    if (!githubInput || !validationMessage) return;

    clearTimeout(debounceTimer);

    const username = githubInput.value.trim();

    if (!username) {
      validationMessage.textContent = "";
      chrome.storage.local.set({ githubUsername: "" });
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
        validationMessage.textContent =
          repos.length === 0 ? "⚠️ No public repositories found" : "";

        await chrome.storage.local.set({ githubUsername: username });
        saveFieldToServer("githubUsername", username);
      } catch {
        validationMessage.textContent = "⚠️ Network error";
      }
    }, 600);
  });

  // 4. Log In
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

  // 5. Log Out
  logoutBtn?.addEventListener("click", async () => {
    await chrome.storage.local.remove("token");
    document.body.classList.remove("logged");
  });
});

let debounceTimer: number;
