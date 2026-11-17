import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createSuggestHandler,
  createLimiter,
  parseSteps,
  MAX_CHARS,
  MAX_REQUESTS_PER_HOUR,
  SYSTEM_PROMPT,
} from "../../server/suggest.js";

const ORIGIN = "https://focus.example.test";
const KEY = "test-key-not-real";
const MODEL = "test-model";

function post(body, headers = {}) {
  return new Request("https://focus.example.test/api/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: ORIGIN, ...headers },
    body: JSON.stringify(body),
  });
}

function fakeFetch(content, ok = true) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: ok ? 200 : 500 });
  };
  fn.calls = calls;
  return fn;
}

test("off when no key is set: the status says unavailable and POST is refused", async () => {
  const handle = createSuggestHandler({ apiKey: "", model: MODEL, appOrigin: ORIGIN });
  const status = await handle(new Request("https://x.test/api/suggest", { method: "GET" }));
  assert.deepEqual(await status.json(), { available: false });
  const refused = await handle(post({ text: "Read chapter 2" }));
  assert.equal(refused.status, 503);
});

test("on when key and model are set: the status says available", async () => {
  const handle = createSuggestHandler({ apiKey: KEY, model: MODEL, appOrigin: ORIGIN, fetchImpl: fakeFetch("") });
  const status = await handle(new Request("https://x.test/api/suggest", { method: "GET" }));
  assert.deepEqual(await status.json(), { available: true });
});

test("requests from another website are refused", async () => {
  const handle = createSuggestHandler({ apiKey: KEY, model: MODEL, appOrigin: ORIGIN, fetchImpl: fakeFetch("Read it") });
  const res = await handle(post({ text: "Read chapter 2" }, { origin: "https://elsewhere.test" }));
  assert.equal(res.status, 403);
});

test("text over 6,000 characters is refused before anything is sent", async () => {
  const fetchImpl = fakeFetch("Read it");
  const handle = createSuggestHandler({ apiKey: KEY, model: MODEL, appOrigin: ORIGIN, fetchImpl });
  const res = await handle(post({ text: "x".repeat(MAX_CHARS + 1) }));
  assert.equal(res.status, 413);
  assert.equal(fetchImpl.calls.length, 0);
});

test("empty text is refused", async () => {
  const handle = createSuggestHandler({ apiKey: KEY, model: MODEL, appOrigin: ORIGIN, fetchImpl: fakeFetch("x") });
  assert.equal((await handle(post({ text: "   " }))).status, 400);
});

test("each visitor is limited per hour", async () => {
  let clock = 0;
  const limiter = createLimiter(() => clock);
  const handle = createSuggestHandler({ apiKey: KEY, model: MODEL, appOrigin: ORIGIN, fetchImpl: fakeFetch("Read it"), limiter });
  for (let i = 0; i < MAX_REQUESTS_PER_HOUR; i++) {
    assert.equal((await handle(post({ text: "Read" }))).status, 200);
  }
  assert.equal((await handle(post({ text: "Read" }))).status, 429);
  clock = 61 * 60 * 1000;
  assert.equal((await handle(post({ text: "Read" }))).status, 200);
});

test("the steps come back as plain lines, without bullets, at most five", async () => {
  const handle = createSuggestHandler({
    apiKey: KEY,
    model: MODEL,
    appOrigin: ORIGIN,
    fetchImpl: fakeFetch("1. Read the instructions\n- Write a plan\nTry the first part\nCheck it\nOne more\nAnd another\nToo many"),
  });
  const body = await (await handle(post({ text: "Essay on rivers" }))).json();
  assert.equal(body.steps.length, 5);
  assert.equal(body.steps[0], "Read the instructions");
  assert.equal(body.steps[1], "Write a plan");
});

test("the server's rules and the student's text go to the service, and nothing else", async () => {
  const fetchImpl = fakeFetch("Read it");
  const handle = createSuggestHandler({ apiKey: KEY, model: MODEL, appOrigin: ORIGIN, fetchImpl });
  await handle(post({ text: "Read chapter 2", kind: "reading" }));
  const sent = JSON.parse(fetchImpl.calls[0].init.body);
  assert.equal(sent.messages[0].content, SYSTEM_PROMPT);
  assert.match(sent.messages[1].content, /Read chapter 2/);
  assert.match(sent.messages[0].content, /Never give the answer/);
});

test("a failed service call gives an unavailable answer, not a crash", async () => {
  const handle = createSuggestHandler({ apiKey: KEY, model: MODEL, appOrigin: ORIGIN, fetchImpl: fakeFetch("", false) });
  assert.equal((await handle(post({ text: "Read" }))).status, 502);
});

test("a message that suggests danger gets the trusted-adult reply, not advice", async () => {
  const handle = createSuggestHandler({ apiKey: KEY, model: MODEL, appOrigin: ORIGIN, fetchImpl: fakeFetch("TRUSTED_ADULT") });
  const body = await (await handle(post({ text: "I don't want to be here" }))).json();
  assert.deepEqual(body, { trustedAdult: true, steps: [] });
});

test("parseSteps drops empty lines and bullets", () => {
  assert.deepEqual(parseSteps("\n- one\n\n2) two\n"), ["one", "two"]);
  assert.deepEqual(parseSteps(undefined), []);
});
