const textarea = document.getElementById("bio") as HTMLTextAreaElement;
const toneSelect = document.getElementById("tone") as HTMLSelectElement;
const checkbox = document.getElementById("autoGenerate") as HTMLInputElement;

document.addEventListener("DOMContentLoaded", async () => {
  const data = await chrome.storage.local.get(["bio", "tone", "autoGenerate"]);
  if (data.bio) textarea.value = data.bio;
  if (data.tone) toneSelect.value = data.tone;
  if (data.autoGenerate) checkbox.checked = data.autoGenerate;
});

document.getElementById("generate")?.addEventListener("click", async () => {
  await chrome.storage.local.set({
    bio: textarea.value,
    tone: toneSelect.value,
    autoGenerate: checkbox.checked,
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id!, {
      type: "GENERATE_PROPOSAL",
    });
  });
});
