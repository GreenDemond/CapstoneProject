import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanQuery, buildSearchUrl, pageUrl, cleanExtract, parseResults, searchWikipedia, MAX_QUERY, MAX_EXTRACT } from "../../js/logic/lookup.js";
import { LOOKUP_ENABLED } from "../../js/lookup-config.js";

const reply = (pages) => ({ query: { pages } });
const okFetch = (body, ok = true) => async () => ({ ok, text: async () => (typeof body === "string" ? body : JSON.stringify(body)) });

test("the shipped switch is off until the parent confirms", () => {
  assert.equal(LOOKUP_ENABLED, false);
});

test("cleanQuery tidies, caps at 100, and survives non-strings", () => {
  assert.equal(cleanQuery("  photo \n\t synthesis  "), "photo synthesis");
  assert.equal(cleanQuery("a\u0000b"), "a b");
  assert.equal(cleanQuery("x".repeat(500)).length, MAX_QUERY);
  for (const v of [undefined, null, 5, {}, []]) assert.equal(cleanQuery(v), "");
  assert.equal(cleanQuery("   "), "");
});

test("buildSearchUrl sends only the words, over https, with origin=*", () => {
  assert.equal(buildSearchUrl("   "), null);
  const url = new URL(buildSearchUrl("Mitosis & meiosis?"));
  assert.equal(url.origin, "https://en.wikipedia.org");
  assert.equal(url.pathname, "/w/api.php");
  assert.equal(url.searchParams.get("gsrsearch"), "Mitosis & meiosis?");
  assert.equal(url.searchParams.get("origin"), "*");
  assert.equal(url.searchParams.get("gsrlimit"), "3");
  assert.equal(url.searchParams.get("explaintext"), "1");
  assert.equal([...url.searchParams.keys()].length, 13);
});

test("pageUrl is always an encoded en.wikipedia.org/wiki link", () => {
  assert.equal(pageUrl("Cell division"), "https://en.wikipedia.org/wiki/Cell_division");
  assert.equal(pageUrl("C#"), "https://en.wikipedia.org/wiki/C%23");
  assert.equal(pageUrl("Star Trek: Voyager"), "https://en.wikipedia.org/wiki/Star_Trek%3A_Voyager");
  const hostile = pageUrl("javascript:alert(1)");
  assert.ok(hostile.startsWith("https://en.wikipedia.org/wiki/"));
  assert.ok(!hostile.includes(":alert"));
  assert.equal(pageUrl("a/../../evil").startsWith("https://en.wikipedia.org/wiki/a%2F"), true);
  for (const bad of ["", "   ", "<b>x</b>", "a|b", "x".repeat(201), null, 3, undefined]) assert.equal(pageUrl(bad), null);
});

test("cleanExtract strips tags, tidies and limits", () => {
  assert.equal(cleanExtract("<b>Hi</b>  <script>alert(1)</script> there"), "Hi alert(1) there");
  assert.equal(cleanExtract("a\u0000b\n\nc"), "a b c");
  const long = cleanExtract("word ".repeat(10000));
  assert.ok(long.length <= MAX_EXTRACT);
  assert.ok(long.endsWith("\u2026"));
  for (const v of [null, 4, {}, undefined]) assert.equal(cleanExtract(v), "");
});

test("parseResults keeps three, in order, no duplicates", () => {
  const pages = [
    { title: "C", extract: "c", index: 3 },
    { title: "A", extract: "a", index: 1 },
    { title: "B", extract: "b", index: 2 },
    { title: "A", extract: "again", index: 4 },
    { title: "D", extract: "d", index: 5 },
  ];
  const out = parseResults(reply(pages));
  assert.deepEqual(out.map((r) => r.title), ["A", "B", "C"]);
  assert.equal(out[0].url, "https://en.wikipedia.org/wiki/A");
});

test("parseResults: no matches is an empty list; wrong shapes are null", () => {
  assert.deepEqual(parseResults({ batchcomplete: true }), []);
  assert.deepEqual(parseResults(reply([])), []);
  for (const bad of [null, undefined, 5, "x", [], { query: null }, { query: {} }, { query: { pages: {} } }, { query: { pages: "x" } }]) {
    assert.equal(parseResults(bad), null);
  }
});

test("parseResults survives hostile shapes", () => {
  const proto = JSON.parse('{"query":{"pages":[{"__proto__":{"title":"Evil"},"extract":"x"},{"title":"Real","extract":"<img src=x onerror=alert(1)>Hello","url":"javascript:alert(1)","fullurl":"https://evil.example"}]}}');
  const out = parseResults(proto);
  assert.deepEqual(out.map((r) => r.title), ["Real"]);
  assert.equal(out[0].extract, "Hello");
  assert.equal(out[0].url, "https://en.wikipedia.org/wiki/Real");
  assert.equal(Object.prototype.title, undefined);
  const odd = parseResults(reply([null, 5, "x", [], { title: 5 }, { title: "javascript:alert(1)", extract: 7, index: "no" }, { title: "H".repeat(1000) }, { title: "<script>" }]));
  assert.equal(odd.length, 1);
  assert.equal(odd[0].extract, "");
  assert.ok(odd[0].url.startsWith("https://en.wikipedia.org/wiki/"));
  const huge = parseResults(reply([{ title: "Big", extract: "z".repeat(5e6) }]));
  assert.ok(huge[0].extract.length <= MAX_EXTRACT);
  const many = parseResults(reply(Array.from({ length: 5000 }, (_, i) => ({ title: `T${i}`, index: i }))));
  assert.equal(many.length, 3);
});

test("searchWikipedia: ok, none, empty", async () => {
  const seen = [];
  const fetchFn = async (url, options) => { seen.push([url, options]); return okFetch(reply([{ title: "Cell", extract: "A cell.", index: 1 }]))(); };
  const r = await searchWikipedia("cell", { fetchFn });
  assert.equal(r.status, "ok");
  assert.equal(r.results[0].title, "Cell");
  assert.equal(seen.length, 1);
  assert.equal(seen[0][1].credentials, "omit");
  assert.equal(seen[0][1].referrerPolicy, "no-referrer");
  assert.equal(seen[0][1].method, "GET");
  assert.ok(seen[0][0].startsWith("https://en.wikipedia.org/"));
  assert.equal((await searchWikipedia("zzz", { fetchFn: okFetch({ batchcomplete: true }) })).status, "none");
  assert.equal((await searchWikipedia("   ", { fetchFn })).status, "empty");
  assert.equal(seen.length, 1);
});

test("searchWikipedia: every failure is a calm error and never throws", async () => {
  assert.equal((await searchWikipedia("x", { fetchFn: async () => { throw new TypeError("offline"); } })).status, "error");
  assert.equal((await searchWikipedia("x", { fetchFn: okFetch({}, false) })).status, "error");
  assert.equal((await searchWikipedia("x", { fetchFn: okFetch("not json {") })).status, "error");
  assert.equal((await searchWikipedia("x", { fetchFn: okFetch("[1,2]") })).status, "error");
  assert.equal((await searchWikipedia("x", { fetchFn: okFetch({ query: { pages: 4 } }) })).status, "error");
  assert.equal((await searchWikipedia("x", { fetchFn: okFetch("x".repeat(300000)) })).status, "error");
  assert.equal((await searchWikipedia("x", { fetchFn: async () => null })).status, "error");
  assert.equal((await searchWikipedia("x", {})).status, "error");
  assert.equal((await searchWikipedia("x", { fetchFn: async () => ({ ok: true, text: async () => { throw new Error("cut off"); } }) })).status, "error");
});

test("searchWikipedia: timeout and cancel", async () => {
  const hang = (url, { signal }) => new Promise((resolve, reject) => { signal.addEventListener("abort", () => reject(new Error("aborted"))); });
  assert.equal((await searchWikipedia("x", { fetchFn: hang, timeoutMs: 20 })).status, "error");
  const outer = new AbortController();
  const pending = searchWikipedia("x", { fetchFn: hang, signal: outer.signal, timeoutMs: 5000 });
  outer.abort();
  assert.equal((await pending).status, "cancelled");
  assert.equal((await searchWikipedia("x", { fetchFn: hang, signal: outer.signal })).status, "cancelled");
});
