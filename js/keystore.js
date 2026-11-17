// Encrypted storage for AI keys in this browser (design/ai-endpoints.md; parent decision 2026-11-17).
// A non-extractable AES key lives in IndexedDB: this page can use it to encrypt and decrypt,
// but cannot read it out. Each saved key is encrypted with a new random IV.
// Keys never go to the log, the server, or the shared settings. This is not protection
// against a malicious script running on this page; the page's rules limit that risk.

const DB_NAME = "focusapp-keys";
const STORE = "keys";
const MASTER_ID = "master";

export function keyStoreAvailable() {
  return Boolean(globalThis.indexedDB && globalThis.crypto?.subtle);
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Runs one request inside its own transaction and resolves with its result once committed.
async function withStore(mode, action) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function masterKey() {
  const existing = await withStore("readonly", (store) => store.get(MASTER_ID));
  if (existing) {
    return existing;
  }
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  await withStore("readwrite", (store) => store.put(key, MASTER_ID));
  return key;
}

// Returns true only if the key was saved. Nothing is thrown to the screen.
export async function saveKey(serviceId, plainKey) {
  try {
    const key = await masterKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plainKey));
    await withStore("readwrite", (store) => store.put({ iv, data: new Uint8Array(data) }, serviceId));
    return true;
  } catch {
    return false;
  }
}

export async function hasKey(serviceId) {
  try {
    const record = await withStore("readonly", (store) => store.get(serviceId));
    return Boolean(record);
  } catch {
    return false;
  }
}

export async function deleteKey(serviceId) {
  try {
    await withStore("readwrite", (store) => store.delete(serviceId));
    return true;
  } catch {
    return false;
  }
}
