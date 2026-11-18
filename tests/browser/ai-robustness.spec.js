import { test, expect } from "@playwright/test";

// Two first-time saves at once must share one master key, so both keys can be read back.
test("two key saves at the same moment both stay readable", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const store = await import("/js/keystore.js");
    await store.deleteKey("a");
    await store.deleteKey("b");
    const saved = await Promise.all([store.saveKey("a", "key-aaaaaaaaaaaa"), store.saveKey("b", "key-bbbbbbbbbbbb")]);
    return { saved, a: await store.readKey("a"), b: await store.readKey("b"), has: await store.hasKey("a") };
  });
  expect(result).toEqual({ saved: [true, true], a: "key-aaaaaaaaaaaa", b: "key-bbbbbbbbbbbb", has: true });
});

// The service call stops at once when the signal is already aborted, and never reaches the network.
test("an already-stopped call does not fetch", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const direct = await import("/js/ai-direct.js");
    let fetched = 0;
    const realFetch = globalThis.fetch;
    globalThis.fetch = (...args) => {
      fetched += 1;
      return realFetch(...args);
    };
    const controller = new AbortController();
    controller.abort();
    const service = { url: "https://ai.example.test/v1/chat/completions", model: "m" };
    const chat = await direct.askChat(service, "k", { kind: "essay", guide: "", length: "short", messages: [{ role: "user", text: "hi" }] }, controller.signal);
    const test = await direct.testService(service, "k", controller.signal);
    return { fetched, chat, test };
  });
  expect(result.fetched).toBe(0);
  expect(result.chat).toEqual({ aborted: true });
  expect(result.test).toEqual({ ok: false, kind: "stopped", aborted: true });
});

// Stop works while the body is still arriving: a body that never finishes is cancelled by the signal.
test("Stop cancels a response whose body never finishes", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const direct = await import("/js/ai-direct.js");
    globalThis.fetch = (url, init) => {
      const body = new ReadableStream({
        start(controller) {
          init.signal.addEventListener("abort", () => controller.error(new DOMException("aborted", "AbortError")));
        },
      });
      return Promise.resolve(new Response(body, { status: 200, headers: { "Content-Type": "application/json" } }));
    };
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 100);
    const service = { url: "https://ai.example.test/v1/chat/completions", model: "m" };
    return direct.askChat(service, "k", { kind: "essay", guide: "", length: "short", messages: [{ role: "user", text: "hi" }] }, controller.signal);
  });
  expect(result).toEqual({ aborted: true });
});
