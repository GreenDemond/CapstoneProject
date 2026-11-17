// The only file that calls /api/suggest (DECISIONS T13). Off unless the server says
// it is available. Any failure returns null, so the app falls back to the no-AI steps.

const ENDPOINT = "/api/suggest";

export async function aiAvailable() {
  try {
    const response = await fetch(ENDPOINT, { method: "GET", cache: "no-store" });
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data?.available === true;
  } catch {
    return false;
  }
}

// Returns { steps } or { trustedAdult: true }, or null if the AI could not help.
export async function suggestWithAi(text, kind) {
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, kind }),
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (data?.trustedAdult === true) {
      return { trustedAdult: true };
    }
    if (Array.isArray(data?.steps) && data.steps.every((s) => typeof s === "string")) {
      return { steps: data.steps };
    }
    return null;
  } catch {
    return null;
  }
}
