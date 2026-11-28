import { test } from "node:test";
import assert from "node:assert/strict";
import { encryptKeys, isSafeKey, decryptKeys, cleanKeysBlock, PBKDF2_ITERATIONS, MIN_ITERATIONS, MAX_ITERATIONS, toBase64 } from "../../js/logic/helpers-crypto.js";

const subtle = globalThis.crypto.subtle;
const rng = (bytes) => globalThis.crypto.getRandomValues(bytes);
const FAST = 1000;
const KEYS = new Map([["h1", "sk-test-AAAA1111BBBB"], ["h3", "sk-test-CCCC2222DDDD"]]);
const PASS = "correct horse battery";
const HELPERS = [
  { ref: "h1", url: "https://a.example/v1/chat/completions", model: "m1" },
  { ref: "h2", url: "https://b.example/v1/chat/completions", model: "m2" },
  { ref: "h3", url: "https://c.example/v1/chat/completions", model: "m3" },
];

test("the real default is at least 600000 rounds", () => {
  assert.ok(PBKDF2_ITERATIONS >= 600000);
});

test("keys round trip with the right passphrase; a helper without a key stays absent", async () => {
  const block = await encryptKeys(subtle, rng, PASS, KEYS, HELPERS, FAST);
  const result = await decryptKeys(subtle, PASS, block, HELPERS);
  assert.equal(result.ok, true);
  assert.deepEqual([...result.keys], [...KEYS]);
  assert.equal(result.keys.has("h2"), false);
});

test("the block has no plain key text", async () => {
  const block = await encryptKeys(subtle, rng, PASS, KEYS, HELPERS, FAST);
  const text = JSON.stringify(block);
  assert.ok(!text.includes("AAAA1111") && !text.includes("sk-test"));
  assert.equal(block.kdf, "PBKDF2-SHA-256");
  assert.equal(block.iterations, FAST);
});

test("a wrong passphrase gives one plain failure", async () => {
  const block = await encryptKeys(subtle, rng, PASS, KEYS, HELPERS, FAST);
  assert.deepEqual(await decryptKeys(subtle, "wrong passphrase!", block, HELPERS), { ok: false });
  assert.deepEqual(await decryptKeys(subtle, "", block, HELPERS), { ok: false });
});

test("a changed ciphertext, salt or iv fails", async () => {
  const block = await encryptKeys(subtle, rng, PASS, KEYS, HELPERS, FAST);
  const flip = (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    bytes[0] ^= 1;
    return toBase64(bytes);
  };
  for (const name of ["data", "salt", "iv"]) {
    assert.deepEqual(await decryptKeys(subtle, PASS, { ...block, [name]: flip(block[name]) }, HELPERS), { ok: false }, name);
  }
});

test("two locks of the same keys differ", async () => {
  const a = await encryptKeys(subtle, rng, PASS, KEYS, HELPERS, FAST);
  const b = await encryptKeys(subtle, rng, PASS, KEYS, HELPERS, FAST);
  assert.notEqual(a.data, b.data);
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.iv, b.iv);
});

test("bad blocks are refused, including hostile iteration counts", async () => {
  const block = await encryptKeys(subtle, rng, PASS, KEYS, HELPERS, FAST);
  const bad = [
    null, "text", [], {}, { ...block, kdf: "other" }, { ...block, iterations: MIN_ITERATIONS - 1 },
    { ...block, iterations: MAX_ITERATIONS + 1 }, { ...block, iterations: "1000" }, { ...block, salt: "AAAA" },
    { ...block, iv: 5 }, { ...block, data: "not base64!" }, { ...block, data: "AAAA" },
  ];
  for (const item of bad) {
    assert.equal(cleanKeysBlock(item), null);
    assert.deepEqual(await decryptKeys(subtle, PASS, item, HELPERS), { ok: false });
  }
});

test("inherited properties are not read from the block", async () => {
  const block = await encryptKeys(subtle, rng, PASS, KEYS, HELPERS, FAST);
  const inherited = Object.create(block);
  assert.equal(cleanKeysBlock(inherited), null);
});

test("unlocked entries with odd names or values are dropped", async () => {
  const odd = new Map([["__proto__", "sk-test-aaaaaaaa"], ["constructor", "sk-test-bbbbbbbb"], ["h1", "sk-test-ok-ok-ok"]]);
  const block = await encryptKeys(subtle, rng, PASS, odd, HELPERS, FAST);
  const result = await decryptKeys(subtle, PASS, block, HELPERS);
  assert.deepEqual([...result.keys.keys()], ["h1"]);
});

test("an edited address, model or ref after locking fails like a wrong passphrase", async () => {
  const block = await encryptKeys(subtle, rng, PASS, KEYS, HELPERS, FAST);
  assert.equal((await decryptKeys(subtle, PASS, block, HELPERS)).ok, true);
  const edits = [
    HELPERS.map((h, i) => (i === 0 ? { ...h, url: "https://evil.example/v1/chat/completions" } : h)),
    HELPERS.map((h, i) => (i === 1 ? { ...h, model: "other" } : h)),
    HELPERS.map((h, i) => (i === 2 ? { ...h, ref: "h9" } : h)),
    HELPERS.slice(0, 2),
    [...HELPERS, { ref: "h4", url: "https://d.example/v1/chat/completions", model: "m4" }],
  ];
  for (const edited of edits) {
    assert.deepEqual(await decryptKeys(subtle, PASS, block, edited), { ok: false });
  }
  assert.deepEqual(await decryptKeys(subtle, PASS, block), { ok: false });
  assert.deepEqual(await decryptKeys(subtle, PASS, block, []), { ok: false });
  assert.equal((await decryptKeys(subtle, PASS, block, [...HELPERS].reverse())).ok, true);
});

test("a __proto__ entry in the keys block is dropped, not applied", async () => {
  const hostile = new Map([["__proto__", "sk-test-aaaaaaaa"], ["h1", "sk-test-ok-ok-ok"]]);
  const block = await encryptKeys(subtle, rng, PASS, hostile, HELPERS, FAST);
  const result = await decryptKeys(subtle, PASS, block, HELPERS);
  assert.equal(result.ok, true);
  assert.deepEqual([...result.keys.keys()], ["h1"]);
  assert.equal(Object.getPrototypeOf({}), Object.prototype);
  assert.equal({}.polluted, undefined);
});

test("keys with newlines, spaces or control characters are refused", async () => {
  for (const bad of ["sk-test-aaaa\nX-Evil: 1", "sk-test aaaa", "sk-test-aaaa\r", "sk-test\u0000aaaa", "sk-test-\u00e9aaaa", "x".repeat(301)]) {
    const block = await encryptKeys(subtle, rng, PASS, new Map([["h1", "sk-test-ok-ok-ok"], ["h2", bad]]), HELPERS, FAST);
    assert.deepEqual(await decryptKeys(subtle, PASS, block, HELPERS), { ok: false }, JSON.stringify(bad));
  }
  assert.equal(isSafeKey("sk-test-ok-ok-ok"), true);
  assert.equal(isSafeKey("a\nb"), false);
});
