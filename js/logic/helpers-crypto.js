// Locks and unlocks the AI keys in an AI helpers file (design/ai-helpers-file.md).
// Pure: no screen, no storage. The browser's SubtleCrypto is passed in, so Node tests can use theirs.
// Passphrase -> PBKDF2-SHA-256 -> AES-GCM 256 key. Each file gets a fresh random salt and IV.
// Nothing here logs or returns a passphrase or a key in text. A failure is one plain result.
import { MAX_KEY_LENGTH } from "./ai-key.js";

export const KDF_NAME = "PBKDF2-SHA-256";
// 600,000 rounds is the current OWASP advice for PBKDF2 with SHA-256. Tests pass a smaller number.
export const PBKDF2_ITERATIONS = 600000;
// A file may ask for fewer or more rounds than the default; these limits stop a hostile file
// from making the page freeze for minutes.
export const MIN_ITERATIONS = 1000;
export const MAX_ITERATIONS = 2000000;
export const SALT_BYTES = 16;
export const IV_BYTES = 12;
export const MAX_BLOCK_TEXT = 40000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function toBase64(bytes) {
  let text = "";
  for (const byte of bytes) {
    text += String.fromCharCode(byte);
  }
  return btoa(text);
}

// Returns a Uint8Array, or null when the text is not base64.
export function fromBase64(text) {
  if (typeof text !== "string" || text.length > MAX_BLOCK_TEXT || !/^[A-Za-z0-9+/]*={0,2}$/.test(text) || text.length % 4 !== 0) {
    return null;
  }
  try {
    const raw = atob(text);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) {
      bytes[i] = raw.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function own(object, name) {
  return object !== null && typeof object === "object" && !Array.isArray(object) && Object.hasOwn(object, name) ? object[name] : undefined;
}

async function deriveKey(subtle, passphrase, salt, iterations) {
  const material = await subtle.importKey("raw", encoder.encode(passphrase.normalize("NFKC")), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

// Locks keys. `keysByRef` is a Map of ref -> plain key. Returns the block to put in the file:
// { kdf, iterations, salt, iv, data } with salt, iv and data in base64.
export async function encryptKeys(subtle, getRandomValues, passphrase, keysByRef, iterations = PBKDF2_ITERATIONS) {
  const salt = getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = getRandomValues(new Uint8Array(IV_BYTES));
  const plain = {};
  for (const [ref, key] of keysByRef) {
    plain[ref] = key;
  }
  const aesKey = await deriveKey(subtle, passphrase, salt, iterations);
  const sealed = await subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoder.encode(JSON.stringify(plain)));
  return { kdf: KDF_NAME, iterations, salt: toBase64(salt), iv: toBase64(iv), data: toBase64(new Uint8Array(sealed)) };
}

// Checks the shape of a keys block read from a file. Returns a clean copy or null.
export function cleanKeysBlock(block) {
  if (own(block, "kdf") !== KDF_NAME) {
    return null;
  }
  const iterations = own(block, "iterations");
  if (!Number.isInteger(iterations) || iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) {
    return null;
  }
  const salt = own(block, "salt");
  const iv = own(block, "iv");
  const data = own(block, "data");
  if (fromBase64(salt)?.length !== SALT_BYTES || fromBase64(iv)?.length !== IV_BYTES) {
    return null;
  }
  const sealed = fromBase64(data);
  if (sealed === null || sealed.length < 17) {
    return null;
  }
  return { kdf: KDF_NAME, iterations, salt, iv, data };
}

// Unlocks keys. Returns { ok: true, keys: Map ref -> key } or { ok: false }. A wrong passphrase, a
// changed file and a damaged block all give the same { ok: false }, so nothing is revealed about why.
export async function decryptKeys(subtle, passphrase, block) {
  const clean = cleanKeysBlock(block);
  if (clean === null || typeof passphrase !== "string" || passphrase === "") {
    return { ok: false };
  }
  try {
    const aesKey = await deriveKey(subtle, passphrase, fromBase64(clean.salt), clean.iterations);
    const opened = await subtle.decrypt({ name: "AES-GCM", iv: fromBase64(clean.iv) }, aesKey, fromBase64(clean.data));
    const parsed = JSON.parse(decoder.decode(opened));
    const keys = new Map();
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      for (const ref of Object.keys(parsed)) {
        const key = own(parsed, ref);
        if (/^h\d{1,2}$/.test(ref) && typeof key === "string" && key !== "" && key.length <= MAX_KEY_LENGTH) {
          keys.set(ref, key);
        }
      }
    }
    return { ok: true, keys };
  } catch {
    return { ok: false };
  }
}
