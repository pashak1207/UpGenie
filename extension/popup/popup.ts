import "./popup.scss";

const textarea = document.getElementById("bio") as HTMLTextAreaElement;
const checkbox = document.getElementById("autoGenerate") as HTMLInputElement;

document.addEventListener("DOMContentLoaded", async () => {
  const data = await chrome.storage.local.get(["bio", "autoGenerate"]);
  if (data.bio) textarea.value = data.bio;
  if (data.autoGenerate) checkbox.checked = data.autoGenerate;
});

textarea?.addEventListener("input", async (e: any) => {
  const value = e?.target?.value;

  await chrome.storage.local.set({
    bio: value,
  });
});

checkbox?.addEventListener("change", async (e: any) => {
  const value = e?.target?.checked;

  await chrome.storage.local.set({
    autoGenerate: value,
  });
});
