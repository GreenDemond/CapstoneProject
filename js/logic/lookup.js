// Look it up (design/look-it-up-w8.md). Pure logic plus one fetch wrapper that takes the fetch function as
// an argument so tests can stub it. It builds a Wikipedia search address from the student's typed words,
// and checks everything that comes back. It never uses an address from the reply: links are built here
// from a checked title. It shows what Wikipedia says; it does not write answers.

export const MAX_QUERY = 100;
export const RESULT_COUNT = 3;
export const MAX_TITLE = 200;
export const MAX_EXTRACT = 400;
export const MAX_RESPONSE_CHARS = 200000;
export const TIMEOUT_MS = 8000;

const API = "https://en.wikipedia.org/w/api.php";
const PAGE = "https://en.wikipedia.org/wiki/";
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g;
const TAGS = /<[^>]*>/g;

// The words to search for: control characters become spaces, runs of spaces become one, cut to 100.
export function cleanQuery(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(CONTROL, " ").replace(/\s+/g, " ").trim().slice(0, MAX_QUERY).trim();
}

// The only thing sent: these search words, in the address. Nothing from the student's saved data.
export function buildSearchUrl(query) {
  const words = cleanQuery(query);
  if (words === "") {
    return null;
  }
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: words,
    gsrnamespace: "0",
    gsrlimit: String(RESULT_COUNT),
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
    exlimit: String(RESULT_COUNT),
    exchars: String(MAX_EXTRACT),
    origin: "*",
  });
  return `${API}?${params.toString()}`;
}

function validTitle(value) {
  if (typeof value !== "string") {
    return null;
  }
  const title = value.replace(CONTROL, " ").replace(/\s+/g, " ").trim();
  if (title === "" || title.length > MAX_TITLE) {
    return null;
  }
  // Characters that cannot be in a Wikipedia title.
  if (/[<>[\]{}|]/.test(title)) {
    return null;
  }
  return title;
}

// The link to a page. Always https://en.wikipedia.org/wiki/ plus the encoded title, so it can never
// be a javascript: address or another site. Returns null if the title is not valid.
export function pageUrl(title) {
  const clean = validTitle(title);
  if (clean === null) {
    return null;
  }
  return PAGE + encodeURIComponent(clean.replace(/ /g, "_"));
}

// Plain text only: tags are removed, spaces tidied, and the length is limited.
export function cleanExtract(value) {
  if (typeof value !== "string") {
    return "";
  }
  let text = value.slice(0, MAX_EXTRACT * 4).replace(TAGS, " ").replace(CONTROL, " ").replace(/\s+/g, " ").trim();
  if (text.length > MAX_EXTRACT) {
    text = `${text.slice(0, MAX_EXTRACT - 1).trim()}\u2026`;
  }
  return text;
}

// Turns Wikipedia's reply into at most three results: [{ title, extract, url }]. Anything odd is skipped.
// Returns null when the reply is not the shape we expect at all.
export function parseResults(data) {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }
  if (!Object.hasOwn(data, "query")) {
    // A search with no matches has no "query" in the reply.
    return [];
  }
  const query = data.query;
  if (query === null || typeof query !== "object" || !Object.hasOwn(query, "pages") || !Array.isArray(query.pages)) {
    return null;
  }
  const items = [];
  for (const page of query.pages.slice(0, 50)) {
    if (page === null || typeof page !== "object" || Array.isArray(page)) {
      continue;
    }
    const title = Object.hasOwn(page, "title") ? validTitle(page.title) : null;
    if (title === null) {
      continue;
    }
    const index = Object.hasOwn(page, "index") && Number.isFinite(page.index) ? page.index : 1e9;
    const extract = Object.hasOwn(page, "extract") ? cleanExtract(page.extract) : "";
    items.push({ title, extract, url: pageUrl(title), index });
  }
  items.sort((a, b) => a.index - b.index);
  const seen = new Set();
  const results = [];
  for (const item of items) {
    if (seen.has(item.title) || results.length >= RESULT_COUNT) {
      continue;
    }
    seen.add(item.title);
    results.push({ title: item.title, extract: item.extract, url: item.url });
  }
  return results;
}

// One search. Returns { status: "ok", results } | { status: "none" } | { status: "cancelled" } | { status: "error" }.
// It never throws. `signal` lets the screen cancel when the student leaves.
export async function searchWikipedia(query, { fetchFn, signal, timeoutMs = TIMEOUT_MS } = {}) {
  const url = buildSearchUrl(query);
  if (url === null) {
    return { status: "empty" };
  }
  if (typeof fetchFn !== "function") {
    return { status: "error" };
  }
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  const onOuterAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      return { status: "cancelled" };
    }
    signal.addEventListener("abort", onOuterAbort);
  }
  try {
    const response = await fetchFn(url, {
      method: "GET",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      redirect: "error",
      signal: controller.signal,
    });
    if (!response || !response.ok) {
      return { status: "error" };
    }
    const text = await response.text();
    if (typeof text !== "string" || text.length > MAX_RESPONSE_CHARS) {
      return { status: "error" };
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { status: "error" };
    }
    const results = parseResults(data);
    if (results === null) {
      return { status: "error" };
    }
    return results.length === 0 ? { status: "none" } : { status: "ok", results };
  } catch {
    if (signal && signal.aborted && !timedOut) {
      return { status: "cancelled" };
    }
    return { status: "error" };
  } finally {
    clearTimeout(timer);
    if (signal) {
      signal.removeEventListener("abort", onOuterAbort);
    }
  }
}
