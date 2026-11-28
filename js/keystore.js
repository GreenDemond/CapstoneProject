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

// Gets the master key, or creates it. The check and the save happen in one readwrite transaction,
// so two saves at once (or two tabs) end up using the same stored key.
async function masterKey() {
  const fresh = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      let stored = null;
      const get = store.get(MASTER_ID);
      get.onsuccess = () => {
        if (get.result) {
          stored = get.result;
        } else {
          stored = fresh;
          store.put(fresh, MASTER_ID);
        }
      };
      tx.oncomplete = () => resolve(stored);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
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
    const master = await withStore("readonly", (store) => store.get(MASTER_ID));
    return Boolean(record && master);
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

// Decrypts a saved key for one request. Used only to make the call to the chosen service.
export async function readKey(serviceId) {
  try {
    const record = await withStore("readonly", (store) => store.get(serviceId));
    const master = await withStore("readonly", (store) => store.get(MASTER_ID));
    if (!record || !master) {
      return null;
    }
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: record.iv }, master, record.data);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

// Deletes the whole encrypted key store (every saved AI key and the master key) from this browser.
// Resolves true when it is gone or was never there; false if the browser refused or it stayed in use.
export function deleteAllKeys() {
  return new Promise((resolve) => {
    if (!globalThis.indexedDB) {
      resolve(true);
      return;
    }
    try {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
      request.onblocked = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}
