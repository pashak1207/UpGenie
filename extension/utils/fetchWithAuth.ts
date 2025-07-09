export async function fetchWithAuth(
  input: RequestInfo,
  init: RequestInit = {}
) {
  try {
    const { token } = await chrome.storage.local.get("token");

    if (!token) {
      throw new Error("No token available");
    }

    const authHeaders = {
      Authorization: `Bearer ${token}`,
      ...init.headers,
    };

    const response = await fetch(input, {
      ...init,
      headers: authHeaders,
    });

    if (response.status === 401) {
      await chrome.storage.local.remove("token");
      document.body.classList.remove("logged");
      throw new Error("Unauthorized: Token invalid or expired");
    }

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error("fetchWithAuth error:", err);
    throw err;
  }
}
