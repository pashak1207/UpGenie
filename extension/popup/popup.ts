import { fetchWithAuth } from "../utils/fetchWithAuth";
import "./popup.scss";

document.addEventListener("DOMContentLoaded", async () => {
  const textarea = document.getElementById("bio") as HTMLTextAreaElement | null;
  const avatar = document.getElementById("avatar") as HTMLImageElement | null;
  const loginBtn = document.getElementById("login") as HTMLButtonElement | null;
  const logoutBtn = document.getElementById(
    "logout"
  ) as HTMLButtonElement | null;
  const githubInput = document.getElementById(
    "github"
  ) as HTMLInputElement | null;
  const refreshBtn = document.getElementById(
    "refresh_github"
  ) as HTMLButtonElement | null;
  const nameInput = document.getElementById("name") as HTMLInputElement | null;
  const validationMessage = document.getElementById(
    "githubValidation"
  ) as HTMLParagraphElement | null;

  // 1. Get token from popup message
  window.addEventListener("message", (event) => {
    const { type, token } = event.data || {};
    if (type === "token" && token) {
      chrome.storage.local.set({ token }, async () => {
        document.body.classList.add("logged");

        try {
          const userData = await fetchWithAuth("https://upgenie.online/api/me");

          chrome.storage.local.set({
            bio: userData.bio || "",
            name: userData.name || "",
            githubUsername: userData.githubUsername || "",
            image: userData.image || "",
          });

          if (textarea) textarea.value = userData.bio || "";
          if (avatar) avatar.src = userData.image || "";
          if (nameInput) nameInput.value = userData.name || "";
          if (githubInput) githubInput.value = userData.githubUsername || "";
        } catch (err) {
          console.error("❌ Failed to fetch user data:", err);
        }
      });
    }
  });

  // 2. Init
  const { token, bio, name, githubUsername, image } =
    await chrome.storage.local.get([
      "token",
      "bio",
      "name",
      "githubUsername",
      "image",
    ]);

  if (token) {
    document.body.classList.add("logged");

    if (textarea) textarea.value = bio || "";
    if (avatar) avatar.src = image || "";
    if (nameInput) nameInput.value = name || "";
    if (githubInput) githubInput.value = githubUsername || "";
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

        const simplifiedRepos = repos.map((repo: any) => {
          return {
            html_url: repo.html_url,
            description: repo.description,
            tags_url: repo.tags_url,
            languages_url: repo.languages_url,
            homepage: repo.homepage,
          };
        });

        const normalizedRepos = simplifiedRepos.map((repo: any) => ({
          ...repo,
          homepage: repo.homepage?.startsWith("http")
            ? repo.homepage
            : repo.homepage
            ? "https://" + repo.homepage
            : null,
        }));

        await chrome.storage.local.set({ githubUsername: username });
        saveFieldToServer("githubUsername", username);

        fetchWithAuth("https://upgenie.online/api/github-repos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            githubUsername: username,
            githubRepos: normalizedRepos,
          }),
        }).catch((err) => {
          console.error("❌ Failed to save GitHub repos:", err);
        });
      } catch {
        validationMessage.textContent = "⚠️ Network error";
      }
    }, 600);
  });

  refreshBtn?.addEventListener("click", async () => {
    const username = githubInput?.value.trim();

    if (!username) {
      validationMessage!.textContent = "❌ GitHub username is empty.";
      return;
    }

    validationMessage!.textContent = "🔄 Refreshing repositories...";

    try {
      const res = await fetch(`https://api.github.com/users/${username}/repos`);

      if (!res.ok) {
        const errorData = await res.json();
        validationMessage!.textContent = `❌ ${errorData.message}`;
        return;
      }

      const repos = await res.json();
      const simplifiedRepos = repos.map((repo: any) => {
        return {
          html_url: repo.html_url,
          description: repo.description,
          tags_url: repo.tags_url,
          languages_url: repo.languages_url,
          homepage: repo.homepage,
        };
      });

      const normalizedRepos = simplifiedRepos.map((repo: any) => ({
        ...repo,
        homepage: repo.homepage?.startsWith("http")
          ? repo.homepage
          : repo.homepage
          ? "https://" + repo.homepage
          : null,
      }));

      await fetchWithAuth("https://upgenie.online/api/github-repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUsername: username,
          githubRepos: normalizedRepos,
        }),
      });

      validationMessage!.textContent =
        "✅ Repositories refreshed successfully.";
    } catch (err) {
      console.error("❌ Refresh failed:", err);
      validationMessage!.textContent = "⚠️ Network error";
    }
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
