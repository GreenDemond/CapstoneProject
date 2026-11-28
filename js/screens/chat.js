// The "Talk it through" screen and "My chats" (design/ai-chat.md, design/chat-history.md).
// A plain chat with the AI helper the student chose. Chats are saved on this device (up to 10).
// Replies are shown whole, as text, never as HTML. The screen is built once; new messages are added to
// the log and the status line is changed in place, so screen readers announce only what is new.
import { KINDS } from "../logic/starter-steps.js";
import { loadWork, loadChats, saveChats, deleteAllChats, loadChatSettings } from "../storage.js";
import { inUseHelper, isReady, usableServices, effortRefusedLine } from "../logic/ai-services.js";
import { readKey } from "../keystore.js";
import { askChat } from "../ai-direct.js";
import { MAX_MESSAGE, OPENING_QUESTION, TRUSTED_ADULT_LINE } from "../logic/chat.js";
import { MAX_CHATS, titleFor, isPlaceholderTitle, upsertChat, deleteChat, trimItems, sentMessages, savableItems, hasContent, dateLabel, isToday } from "../logic/chat-store.js";
import { aboutLine, cleanStep, stepsFromChat, TALK_CLEAR, TALK_USE_STEPS, TALK_BACK_TO_STEP, STEP_SENT_LINE, EDITOR_BUSY_LINE } from "../logic/chat-steps.js";
import { isOpenRouter } from "../logic/settings-flow.js";
import { guideFor, lengthFor } from "../logic/chat-settings.js";
import { getAiSettings, openSettingsScreen, setChosenHelper } from "../settings.js";
import { el, button } from "../ui/dom.js";
import { showScreen } from "../ui/screens.js";
import { where } from "../ui/helpers.js";

const chatBody = document.getElementById("chat-body");
const chatHeading = document.getElementById("chat-heading");
let getChosenKind = () => null; // set by initChat: the kind picked on the home screen
let useStepsInEditor = () => false; // set by initChat: opens the steps editor with these lines; false when it cannot
let chatBack = null; // set when the chat was opened from a step: { focusAfter } for "Back to my step"
let chat = null; // the open chat: { id, kind, title, startedOn, usedOn, items: [{ who, text, flagged? }], step? } (step is in memory only, never saved)
let chatView = "chat"; // "chat" or "list" (My chats)
let chatCarry = null; // an older chat offered above a fresh one
let chatBusy = false;
let chatPending = false; // the student's message is on screen and its reply has not come yet
let chatListStatus = null; // the status line of My chats, made once
let chatRun = 0; // changes on New chat, Back, and Stop, so a late reply is ignored
let chatAbort = null;
let effortLineShown = false; // the thinking-setting line is shown once per visit to the chat
let chatSearch = false; // "Search the web" ticked; off at the start of every chat and when a chat is opened
let chatParts = null; // the pieces on screen: log, input, send, stop, status, carry, useHolder

function currentChatHelper() {
  const { services, chosenId } = getAiSettings();
  const helper = inUseHelper(services, chosenId);
  return helper && isReady(helper) ? helper : null;
}

function blankChat(kind) {
  const now = new Date().toISOString();
  return { id: `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, kind, title: "", startedOn: now, usedOn: now, items: [] };
}

// The kind saved with the student's steps, else the one chosen on the paste screen.
function defaultChatKind() {
  return loadWork().work?.kind ?? getChosenKind() ?? null;
}

// Cancels a reply that is still coming. The unanswered message was never saved: it is taken back out of
// the chat, and its words wait in the box if the student returns to this chat during this visit.
function resetChat() {
  chatRun += 1;
  chatAbort?.abort();
  chatBusy = false;
  if (chatPending && chat?.items.at(-1)?.who === "you") {
    chat.giveBack = chat.items.pop().text;
  }
  chatPending = false;
}

// Saves the open chat (or takes it out of the list when nothing is left in it). Returns true when confirmed.
// A title is only made from a saved message of the student's. With none, it is cleared and made again later.
function clearTitleIfNoMessage() {
  if (!savableItems(chat.items).some((item) => item.who === "you")) {
    chat.title = "";
  }
}

function saveChat() {
  clearTitleIfNoMessage();
  const stored = loadChats();
  if (!hasContent(chat.items)) {
    return stored.some((c) => c.id === chat.id) ? saveChats(deleteChat(stored, chat.id)) : true;
  }
  const items = savableItems(chat.items);
  if (chat.title === "" || isPlaceholderTitle(chat.title)) {
    chat.title = titleFor(chat.kind, items);
  }
  const saved = { id: chat.id, kind: chat.kind, title: chat.title, startedOn: chat.startedOn, usedOn: chat.usedOn, items: trimItems(items) };
  const next = upsertChat(stored, saved, new Date());
  chat.usedOn = next[0].usedOn;
  return saveChats(next);
}

function saveChatAndWarn() {
  if (!saveChat()) {
    setChatStatus("This chat couldn't be saved on this device. Deleting an old chat makes room.");
  }
}

function showChat() {
  chatHeading.textContent = chatView === "list" ? "My chats" : "Talk it through";
  if (chatView === "list") {
    renderChatList();
  } else {
    buildChat();
  }
}

function openChatScreen() {
  chatBack = null;
  resetChat();
  chatSearch = false;
  effortLineShown = false;
  showScreen("chat");
  chatView = "chat";
  const [recent] = loadChats();
  if (recent && isToday(recent.usedOn)) {
    chat = { ...recent, items: recent.items.map((item) => ({ ...item })) };
    chatCarry = null;
  } else {
    chat = blankChat(defaultChatKind());
    chatCarry = recent ?? null;
  }
  showChat();
  chatHeading.focus();
}

function leaveChat() {
  resetChat();
  chat = null;
  chatCarry = null;
  chatParts = null;
  chatBack = null;
  chatBody.replaceChildren();
}

function closeChat() {
  leaveChat();
  showScreen("home");
  document.getElementById("open-chat").focus();
}

// "Back to my step": the work screen is still as the student left it.
function backToStep() {
  const back = chatBack;
  leaveChat();
  showScreen("work");
  back?.focusAfter?.();
}

// True when a chat about a step can be opened: an AI helper is ready.
export function chatReady() {
  return currentChatHelper() !== null;
}

// Opens a fresh chat about one step (the Stuck view's "Talk about this step"). The step is kept in memory
// for this chat only. focusAfter runs when the student comes back.
export function openChatAboutStep(stepText, kind, focusAfter) {
  resetChat();
  chatSearch = false;
  effortLineShown = false;
  const [recent] = loadChats();
  showScreen("chat");
  chatView = "chat";
  chat = blankChat(kind ?? defaultChatKind());
  chat.step = cleanStep(stepText);
  chatCarry = recent ?? null;
  chatBack = { focusAfter };
  showChat();
  chatHeading.focus();
}

function openSavedChat(id) {
  const found = loadChats().find((c) => c.id === id);
  if (!found) {
    return;
  }
  resetChat();
  chatSearch = false;
  chat = { ...found, items: found.items.map((item) => ({ ...item })) };
  chatCarry = null;
  chatView = "chat";
  showChat();
  chatParts.input.focus();
}

// "Clear": the chat is no longer about the step. A new chat starts; the old one stays in My chats.
function clearStep() {
  newChat();
}

function newChat() {
  resetChat();
  chatSearch = false;
  chat = blankChat(defaultChatKind() ?? chat.kind);
  chatCarry = null;
  buildChat();
  chatParts.input.focus();
}

function showChatList() {
  resetChat();
  chatCarry = null;
  chatParts = null;
  chatView = "list";
  showChat();
  chatHeading.focus();
}

function backToChat() {
  chatView = "chat";
  showChat();
  chatParts.input.focus();
}

function setChatStatus(text) {
  if (chatParts) {
    chatParts.status.textContent = text;
  }
}

function setChatBusy(busy) {
  chatBusy = busy;
  if (chatParts) {
    chatParts.send.disabled = busy;
    chatParts.stop.hidden = !busy;
  }
  // The helper cannot change while a reply is coming, so the screen never names a different one.
  const helperSelect = document.getElementById("chat-helper");
  if (helperSelect) {
    helperSelect.disabled = busy;
  }
}

function addChatBubble(who, text, extra = {}) {
  chat.items.push({ who, text, ...extra });
  if (chatParts) {
    chatParts.carry.hidden = true;
    chatParts.log.append(chatBubble(who, text));
    chatParts.log.scrollTop = chatParts.log.scrollHeight;
  }
  refreshUseSteps();
}

// "Use these as my steps" shows under the chat only while the newest message is an AI reply that is a list.
function refreshUseSteps() {
  if (!chatParts) {
    return;
  }
  chatParts.useHolder.replaceChildren();
  const steps = stepsFromChat(chat.items);
  if (steps.length === 0) {
    return;
  }
  const use = button(TALK_USE_STEPS, () => {
    if (!useStepsInEditor(steps, chat.kind)) {
      setChatStatus(EDITOR_BUSY_LINE);
      return;
    }
    leaveChat(); // the home screen is showing, with the editor open
  });
  use.id = "chat-use-steps";
  chatParts.useHolder.append(use);
}

// The links under a reply. Titles are text. An address is used only if it is https, and the link opens
// in a new tab without passing anything on.
function sourcesNode(links) {
  const box = el("div", undefined, { class: "chat-sources" });
  box.append(el("span", "Sources", { class: "chat-who" }));
  const list = el("ul");
  for (const link of links) {
    if (typeof link.url !== "string" || !link.url.startsWith("https://")) continue;
    const a = el("a", link.title, { target: "_blank", rel: "noopener noreferrer" });
    a.href = link.url;
    const item = el("li");
    item.append(a);
    list.append(item);
  }
  box.append(list);
  return box;
}

function addSources(links) {
  if (links.length === 0) {
    return;
  }
  chat.items.push({ who: "sources", text: "", links });
  if (chatParts) {
    chatParts.log.append(sourcesNode(links));
    chatParts.log.scrollTop = chatParts.log.scrollHeight;
  }
}

function chatBubble(who, text) {
  const bubble = el("div", undefined, { class: `chat-msg chat-${who}` });
  if (who !== "note") {
    bubble.append(el("span", who === "you" ? "You" : "AI", { class: "chat-who" }));
  }
  bubble.append(el("p", text));
  return bubble;
}

function buildChat() {
  chatBody.replaceChildren();
  chatParts = null;
  const helper = currentChatHelper();
  const hasSaved = loadChats().length > 0;
  if (!helper && !hasSaved) {
    chatBody.append(
      el("p", "Add an AI helper in Settings first.", { class: "hint" }),
      button("Open Settings", () => openSettingsScreen(), "primary"),
      button("Back to home", closeChat),
    );
    return;
  }
  let goesTo = null;
  if (helper) {
    goesTo = el("p", "", { class: "hint", id: "chat-goes-to" });
    chatBody.append(
      goesTo,
      el("p", "An AI can still get it wrong. If it gives you a finished answer, don't copy it.", { class: "hint" }),
    );
  } else {
    chatBody.append(
      el("p", "Add an AI helper in Settings first.", { class: "hint" }),
      el("p", "Your chats are saved on this device only. You can still read them.", { class: "hint" }),
    );
  }

  const carry = chatCarry
    ? button(`Carry on: ${chatCarry.title}`, () => openSavedChat(chatCarry.id), "chat-carry")
    : el("span");
  carry.hidden = chatCarry === null || chat.items.length > 0;
  chatBody.append(carry);

  const about = aboutLine(chat.step);
  if (about !== null) {
    const row = el("p", undefined, { class: "chat-about", id: "chat-about" });
    row.append(el("span", about), " ");
    const clear = button(TALK_CLEAR, clearStep, "small");
    clear.setAttribute("aria-label", `${TALK_CLEAR}: stop talking about this step`);
    row.append(clear);
    chatBody.append(row);
  }

  const kinds = el("div", undefined, { class: "kind-buttons", role: "group", "aria-label": "What kind of work is this?" });
  const chatKindButtons = [];
  for (const kind of KINDS) {
    const b = button(kind.label, () => {
      chat.kind = kind.id;
      chatKindButtons.forEach((other, i) => other.setAttribute("aria-pressed", String(KINDS[i].id === chat.kind)));
      chatParts.input.focus();
    }, "kind");
    b.setAttribute("aria-pressed", String(kind.id === chat.kind));
    chatKindButtons.push(b);
    kinds.append(b);
  }
  chatBody.append(kinds);

  // The line about where messages go and the Search the web box follow the helper in use, and are redrawn
  // in place when another helper is picked, so a half-typed message stays.
  const searchBox = el("div", undefined, { class: "chat-search" });
  const drawHelper = () => {
    const current = currentChatHelper();
    if (goesTo && current) {
      goesTo.textContent = `Your chats are saved on this device only. Your messages go to the AI service ${where(current)}. Don't type your name or anything private. Replies come from an AI, not a person.${chat.step ? ` ${STEP_SENT_LINE}` : ""}`;
    }
    searchBox.replaceChildren();
    searchBox.hidden = !(current && isOpenRouter(current.url));
    if (!searchBox.hidden) {
      const tick = el("input", undefined, { type: "checkbox", id: "chat-search" });
      tick.checked = chatSearch;
      tick.addEventListener("change", () => {
        chatSearch = tick.checked;
      });
      searchBox.append(
        tick,
        el("label", "Search the web", { for: "chat-search" }),
        el("p", "Uses your OpenRouter credit (about 1 cent per message).", { class: "hint" }),
      );
    }
  };
  // With more than one ready helper, the same "Which AI helper?" menu as the paste screen. The next message
  // goes to the one chosen, even in the middle of a chat.
  const ready = usableServices(getAiSettings().services);
  if (helper && ready.length > 1) {
    const select = el("select", undefined, { id: "chat-helper" });
    for (const item of ready) {
      const option = el("option", item.label, { value: item.id });
      option.selected = item.id === helper.id;
      select.append(option);
    }
    select.addEventListener("change", () => {
      setChosenHelper(select.value);
      drawHelper();
    });
    const row = el("p", undefined, { id: "chat-helper-row" });
    row.append(el("label", "Which AI helper?", { for: "chat-helper" }), " ", select);
    chatBody.append(row);
  }
  drawHelper();
  chatBody.append(searchBox);

  const log = el("div", undefined, { class: "chat-log", role: "log", "aria-live": "polite", "aria-label": "Chat" });
  const input = el("textarea", undefined, { id: "chat-input", rows: "3", "aria-label": "Your message" });
  input.addEventListener("keydown", (event) => {
    // Enter sends and Shift+Enter makes a new line, on a computer. On a phone Enter is a new line.
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing && globalThis.matchMedia?.("(pointer: fine)").matches) {
      event.preventDefault();
      sendChat();
    }
  });
  const send = button("Send", sendChat, "primary");
  send.id = "chat-send";
  const stop = button("Stop", stopChat);
  stop.hidden = true;
  const actions = el("div", undefined, { class: "kind-buttons" });
  actions.append(send, stop, button("New chat", newChat), button("My chats", showChatList));
  if (!helper) {
    actions.append(button("Open Settings", () => openSettingsScreen()));
  }
  if (chatBack) {
    actions.append(button(TALK_BACK_TO_STEP, backToStep));
  }
  actions.append(button("Back to home", closeChat));
  const status = el("p", "", { id: "chat-status", class: "message", role: "status", "aria-live": "polite" });
  const useHolder = el("div");
  chatBody.append(log, useHolder, input, actions, status);
  chatParts = { log, input, send, stop, status, carry, useHolder };

  log.append(chatBubble("ai", OPENING_QUESTION));
  for (const item of chat.items) {
    log.append(item.who === "sources" ? sourcesNode(item.links) : chatBubble(item.who, item.text));
  }
  log.scrollTop = log.scrollHeight;
  refreshUseSteps();
  if (chat.giveBack) {
    input.value = chat.giveBack;
    delete chat.giveBack;
  }
  setChatBusy(chatBusy);
}

// My chats: its own view, in place of the chat. ask is { id } or { all: true } while a second tap is wanted.
// message is announced in the status line, which stays on the screen between redraws so it is read out.
function renderChatList(ask = null, focusKey = null, message = "") {
  chatListStatus ??= el("p", "", { class: "message", role: "status", "aria-live": "polite" });
  const status = chatListStatus;
  status.textContent = "";
  for (const node of [...chatBody.childNodes]) {
    if (node !== status) node.remove();
  }
  if (status.parentNode !== chatBody) {
    chatBody.prepend(status);
  }
  const chats = loadChats();
  const refs = new Map();

  // Takes a deleted chat out of the open view too, so it cannot come back on the next message.
  const afterDelete = () => {
    if (!loadChats().some((c) => c.id === chat.id)) {
      chat = blankChat(defaultChatKind() ?? chat.kind);
    }
  };
  const confirmRow = (label, onYes, onKeep, yesKey) => {
    const group = el("div", undefined, { class: "kind-buttons", role: "group", "aria-label": label });
    const yes = button("Yes, delete", onYes);
    refs.set(yesKey, yes);
    group.append(el("span", label), yes, button("Keep it", onKeep));
    return group;
  };

  if (chats.length === 0) {
    chatBody.append(el("p", "No saved chats yet."));
  } else {
    const list = el("ul", undefined, { class: "chat-list" });
    for (const c of chats) {
      const item = el("li");
      const open = el("button", undefined, { type: "button", class: "chat-open" });
      open.setAttribute("aria-label", `${c.title}, ${dateLabel(c.usedOn)}`);
      open.append(el("span", c.title, { class: "chat-row-title" }), el("span", dateLabel(c.usedOn), { class: "chat-row-date" }));
      open.addEventListener("click", () => openSavedChat(c.id));
      item.append(open);
      if (ask?.id === c.id) {
        item.append(confirmRow("Delete this chat?", () => {
          if (!saveChats(deleteChat(loadChats(), c.id))) {
            status.textContent = "That chat couldn't be deleted. Try again.";
            return;
          }
          afterDelete();
          renderChatList(null, "heading", "Chat deleted.");
        }, () => renderChatList(null, `del-${c.id}`), `yes-${c.id}`));
      } else {
        const del = button("Delete", () => renderChatList({ id: c.id }, `yes-${c.id}`));
        del.setAttribute("aria-label", `Delete: ${c.title}`);
        refs.set(`del-${c.id}`, del);
        item.append(del);
      }
      list.append(item);
    }
    chatBody.append(list);
    if (ask?.all) {
      chatBody.append(confirmRow("Delete all my chats?", () => {
        if (!deleteAllChats()) {
          status.textContent = "Your chats couldn't be deleted. Try again.";
          return;
        }
        afterDelete();
        renderChatList(null, "heading", "All chats deleted.");
      }, () => renderChatList(null, "all"), "yes-all"));
    } else {
      const all = button("Delete all my chats", () => renderChatList({ all: true }, "yes-all"));
      refs.set("all", all);
      chatBody.append(all);
    }
    chatBody.append(
      el("p", `Keeps your ${MAX_CHATS} most recent chats.`, { class: "hint" }),
      el("p", "Anyone using this browser can see these.", { class: "hint" }),
    );
  }
  chatBody.append(button("Back to the chat", backToChat, "primary"));
  (focusKey === "heading" ? chatHeading : refs.get(focusKey))?.focus();
  if (message !== "") {
    status.textContent = message;
  }
}

// Puts the student's own words back in the box, in front of anything typed since.
function giveBackWords(text) {
  const typed = chatParts.input.value;
  chatParts.input.value = typed.trim() === "" ? text : `${text}\n${typed}`;
}

// Takes the last (unsaved) message back out of the chat, and returns its words to the box.
function takeBackLastMessage() {
  const last = chat.items.pop();
  chatParts.log.lastElementChild?.remove();
  giveBackWords(last.text);
  clearTitleIfNoMessage();
  refreshUseSteps();
}

function stopChat() {
  chatRun += 1;
  chatAbort?.abort();
  setChatBusy(false);
  chatPending = false;
  // The last message was not answered: take it back out and return the words to the box.
  if (chat.items.at(-1)?.who === "you") {
    takeBackLastMessage();
  }
  setChatStatus("Stopped. Your message is back in the box.");
  chatParts.input.focus();
}

async function sendChat() {
  if (chatBusy || !chatParts) {
    return;
  }
  const text = chatParts.input.value.trim();
  if (text === "") {
    return;
  }
  if (text.length > MAX_MESSAGE) {
    setChatStatus("That message is long. Shorten it and try again.");
    return;
  }
  if (chat.kind === null) {
    setChatStatus("Tap the kind of work it is, then send again.");
    return;
  }
  const service = currentChatHelper();
  setChatBusy(true); // set before waiting for the key, so a quick second tap sends nothing
  const run = (chatRun += 1);
  const key = service ? await readKey(service.id) : null;
  if (run !== chatRun) {
    return; // Back or New chat was pressed while the key was being read
  }
  if (!service || !key) {
    setChatBusy(false);
    setChatStatus("No AI helper is ready. Finish one in Settings first.");
    return;
  }

  chatParts.input.value = "";
  addChatBubble("you", text); // not saved yet: it is saved with its reply, so a refresh now loses only this message
  chatPending = true;
  const search = chatSearch && isOpenRouter(service.url);
  setChatStatus(search ? `Searching the web and asking ${service.label}...` : `Waiting for ${service.label}...`);
  chatAbort = new AbortController();
  chatParts.input.focus();
  const slowNote = setTimeout(() => {
    if (run === chatRun) {
      setChatStatus(`Still waiting for ${service.label}. Slower AIs can take a few minutes.`);
    }
  }, 10000);

  // Settings are read now, so a change made in Settings applies to the next message.
  const mine = loadChatSettings();
  const result = await askChat(service, key, { kind: chat.kind, guide: guideFor(mine, chat.kind), length: lengthFor(mine, chat.kind), messages: sentMessages(chat.items), search, step: chat.step ?? "" }, chatAbort.signal);
  clearTimeout(slowNote);
  if (run !== chatRun) {
    return; // Stop, New chat, or Back was pressed: ignore a late answer
  }
  setChatBusy(false);
  chatPending = false;
  setChatStatus("");

  if (result.error || result.empty) {
    // Nothing usable came back: take the message back out and return the words to the box.
    takeBackLastMessage();
    setChatStatus(
      result.error
        ? `${result.error} Your message is back in the box.`
        : result.cutOff
          ? "The AI ran out of room before answering. Try again, or pick a different AI in Settings. Your message is back in the box."
          : "The AI sent an empty reply. Try again. Your message is back in the box.",
    );
  } else if (result.trustedAdult) {
    // The student's message stays on screen for this visit only: it is not saved, not used in the
    // title, and not sent again with later ones. The adult line is shown and saved.
    chat.items.at(-1).flagged = true;
    addChatBubble("note", TRUSTED_ADULT_LINE);
    saveChatAndWarn();
  } else {
    addChatBubble("ai", result.text);
    if (result.effortRefused && !effortLineShown) {
      effortLineShown = true;
      setChatStatus(effortRefusedLine(service));
    }
    addSources(result.sources ?? []);
    if (result.cutOff) {
      addChatBubble("note", "The reply was cut off by the AI service.");
    }
    saveChatAndWarn();
  }
}

// getChosenKind says which kind of work the student picked on the home screen.
export function initChat({ getChosenKind: getter, useSteps }) {
  getChosenKind = getter;
  useStepsInEditor = useSteps ?? useStepsInEditor;
  document.getElementById("open-chat").addEventListener("click", openChatScreen);
}
