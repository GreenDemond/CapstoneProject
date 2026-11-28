import { test } from "node:test";
import assert from "node:assert/strict";
import { encryptKeys, decryptKeys, cleanKeysBlock, PBKDF2_ITERATIONS, MIN_ITERATIONS, MAX_ITERATIONS, toBase64 } from "../../js/logic/helpers-crypto.js";

const subtle = globalThis.crypto.subtle;
const rng = (bytes) => globalThis.crypto.getRandomValues(bytes);
const FAST = 1000;
const KEYS = new Map([["h1", "sk-test-AAAA1111BBBB"], ["h3", "sk-test-CCCC2222DDDD"]]);
const PASS = "correct horse battery";

test("the real default is at least 600000 rounds", () => {
  assert.ok(PBKDF2_ITERATIONS >= 600000);
});

test("keys round trip with the right passphrase; a helper without a key stays absent", async () => {
  const block = await encryptKeys(subtle, rng, PASS, KEYS, FAST);
  const result = await decryptKeys(subtle, PASS, block);
  assert.equal(result.ok, true);
  assert.deepEqual([...result.keys], [...KEYS]);
  assert.equal(result.keys.has("h2"), false);
});

test("the block has no plain key text", async () => {
  const block = await encryptKeys(subtle, rng, PASS, KEYS, FAST);
  const text = JSON.stringify(block);
  assert.ok(!text.includes("AAAA1111") && !text.includes("sk-test"));
  assert.equal(block.kdf, "PBKDF2-SHA-256");
  assert.equal(block.iterations, FAST);
});

test("a wrong passphrase gives one plain failure", async () => {
  const block = await encryptKeys(subtle, rng, PASS, KEYS, FAST);
  assert.deepEqual(await decryptKeys(subtle, "wrong passphrase!", block), { ok: false });
  assert.deepEqual(await decryptKeys(subtle, "", block), { ok: false });
});

test("a changed ciphertext, salt or iv fails", async () => {
  const block = await encryptKeys(subtle, rng, PASS, KEYS, FAST);
  const flip = (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    bytes[0] ^= 1;
    return toBase64(bytes);
  };
  for (const name of ["data", "salt", "iv"]) {
    assert.deepEqual(await decryptKeys(subtle, PASS, { ...block, [name]: flip(block[name]) }), { ok: false }, name);
  }
});

test("two locks of the same keys differ", async () => {
  const a = await encryptKeys(subtle, rng, PASS, KEYS, FAST);
  const b = await encryptKeys(subtle, rng, PASS, KEYS, FAST);
  assert.notEqual(a.data, b.data);
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.iv, b.iv);
});

test("bad blocks are refused, including hostile iteration counts", async () => {
  const block = await encryptKeys(subtle, rng, PASS, KEYS, FAST);
  const bad = [
    null, "text", [], {}, { ...block, kdf: "other" }, { ...block, iterations: MIN_ITERATIONS - 1 },
    { ...block, iterations: MAX_ITERATIONS + 1 }, { ...block, iterations: "1000" }, { ...block, salt: "AAAA" },
    { ...block, iv: 5 }, { ...block, data: "not base64!" }, { ...block, data: "AAAA" },
  ];
  for (const item of bad) {
    assert.equal(cleanKeysBlock(item), null);
    assert.deepEqual(await decryptKeys(subtle, PASS, item), { ok: false });
  }
});

test("inherited properties are not read from the block", async () => {
  const block = await encryptKeys(subtle, rng, PASS, KEYS, FAST);
  const inherited = Object.create(block);
  assert.equal(cleanKeysBlock(inherited), null);
});

test("unlocked entries with odd names or values are dropped", async () => {
  const odd = new Map([["__proto__", "sk-test-aaaaaaaa"], ["constructor", "sk-test-bbbbbbbb"], ["h1", "sk-test-ok-ok-ok"], ["h2", ""]]);
  const block = await encryptKeys(subtle, rng, PASS, odd, FAST);
  const result = await decryptKeys(subtle, PASS, block);
  assert.deepEqual([...result.keys.keys()], ["h1"]);
});
