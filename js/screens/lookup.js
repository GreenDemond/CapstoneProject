// Look it up (design/look-it-up-w8.md): the student types a few words and sees what Wikipedia says.
// Only the typed words leave the device, and nothing is saved. It is OFF unless LOOKUP_ENABLED is true
// (js/lookup-config.js). Everything from Wikipedia goes on screen with textContent.
import { LOOKUP_ENABLED } from "../lookup-config.js";
import { cleanQuery, searchWikipedia, MAX_QUERY } from "../logic/lookup.js";
import { el, button, announce } from "../ui/dom.js";
import { showScreen } from "../ui/screens.js";

const body = document.getElementById("lookup-body");
const heading = document.getElementById("lookup-heading");
const openButton = document.getElementById("open-lookup");

let back = { screen: "home", label: "Back to home", focusAfter: () => openButton.focus() };
let query = "";
let busy = false;
let controller = null;
let statusNode = null;
let resultsNode = null;
let searchButton = null;
let inputNode = null;
let token = 0; // a newer search or leaving the screen makes an older reply ignored

export function lookupEnabled() {
  return LOOKUP_ENABLED;
}

function cancelSearch() {
  token += 1;
  if (controller) {
    controller.abort();
    controller = null;
  }
  busy = false;
}

function leave() {
  cancelSearch();
  showScreen(back.screen);
  back.focusAfter();
}

function say(text) {
  announce(statusNode, text);
}

function showResults(results) {
  resultsNode.replaceChildren();
  const list = el("ul", undefined, { class: "lookup-list" });
  for (const item of results) {
    const li = el("li");
    li.append(el("h3", item.title));
    if (item.extract) {
      li.append(el("p", item.extract));
    }
    const link = el("a", "Read it on Wikipedia", { href: item.url, target: "_blank", rel: "noopener noreferrer", "aria-label": `Read it on Wikipedia: ${item.title}` });
    li.append(el("p")).lastChild.append(link);
    list.append(li);
  }
  resultsNode.append(list);
  resultsNode.append(el("p", "Text from Wikipedia, shared under CC BY-SA.", { class: "hint" }));
}

async function runSearch() {
  if (busy) {
    return;
  }
  query = cleanQuery(inputNode.value);
  if (query === "") {
    resultsNode.replaceChildren();
    say("Type a few words to look up.");
    inputNode.focus();
    return;
  }
  busy = true;
  searchButton.disabled = true;
  resultsNode.replaceChildren();
  say("Looking...");
  const mine = ++token;
  controller = new AbortController();
  const outcome = await searchWikipedia(query, { fetchFn: (...args) => globalThis.fetch(...args), signal: controller.signal });
  if (mine !== token) {
    return; // the student left, so nothing is shown
  }
  controller = null;
  busy = false;
  searchButton.disabled = false;
  if (outcome.status === "ok") {
    say("Here is what Wikipedia says.");
    showResults(outcome.results);
  } else if (outcome.status === "none") {
    say("Wikipedia has nothing for those words. Try different words.");
  } else {
    say("That didn't work. Check your internet and try again.");
  }
}

function render() {
  body.replaceChildren();
  body.append(button(back.label, leave));
  body.append(
    el("p", "Your words go to Wikipedia.", { class: "hint", id: "lookup-notice" }),
    el("p", "This shows what Wikipedia says. It does not write your answer for you.", { class: "hint" }),
  );
  const form = el("form", undefined, { class: "lookup-form" });
  inputNode = el("input", undefined, { type: "text", id: "lookup-input", maxlength: String(MAX_QUERY), autocomplete: "off", enterkeyhint: "search" });
  inputNode.value = query;
  searchButton = el("button", "Search Wikipedia", { type: "submit", class: "primary" });
  form.append(el("label", "What do you want to look up?", { for: "lookup-input" }), inputNode, searchButton);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    runSearch();
  });
  body.append(form);
  statusNode = el("p", undefined, { class: "message", role: "status", id: "lookup-status" });
  resultsNode = el("div", undefined, { id: "lookup-results" });
  body.append(statusNode, resultsNode);
}

// Opens the screen. `from` says where Back goes: { screen, label, focusAfter }.
export function openLookup(from) {
  if (!LOOKUP_ENABLED) {
    return;
  }
  cancelSearch();
  back = from || { screen: "home", label: "Back to home", focusAfter: () => openButton.focus() };
  query = "";
  showScreen("lookup");
  render();
  heading.focus();
}

export function initLookup() {
  if (!LOOKUP_ENABLED) {
    return; // the button stays hidden and nothing is wired up
  }
  openButton.hidden = false;
  openButton.addEventListener("click", () => openLookup());
}
