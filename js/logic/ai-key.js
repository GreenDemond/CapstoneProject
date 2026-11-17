// Checks a typed AI key before it is saved (design/ai-endpoints.md). No screen or storage code here.
export const MIN_KEY_LENGTH = 8;
export const MAX_KEY_LENGTH = 300;

// Returns { ok: true, key } or { ok: false, reason }. The key is trimmed; it is never shown back in full.
export function checkKey(text) {
  const key = typeof text === "string" ? text.trim() : "";
  if (key === "") {
    return { ok: false, reason: "Paste the key first." };
  }
  if (/\s/.test(key)) {
    return { ok: false, reason: "A key has no spaces. Paste it again." };
  }
  if (key.length < MIN_KEY_LENGTH) {
    return { ok: false, reason: "That key looks too short. Check you copied all of it." };
  }
  if (key.length > MAX_KEY_LENGTH) {
    return { ok: false, reason: "That key is too long. Check you copied only the key." };
  }
  return { ok: true, key };
}

// The last four characters, shown as "Key saved: ••••abcd". Safe to keep beside the service name.
export function keyHint(key) {
  return key.slice(-4);
}

export function maskedKey(hint) {
  return `••••${hint}`;
}
