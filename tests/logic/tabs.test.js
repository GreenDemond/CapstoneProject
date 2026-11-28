import { test } from "node:test";
import assert from "node:assert/strict";
import { TABS, tabForScreen, tabBarVisible, screenForTab, WELCOME_LINE, WELCOME_HIDE } from "../../js/logic/tabs.js";
import { loadWelcomeSeen, saveWelcomeSeen, STORAGE_KEY } from "../../js/storage.js";

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    _data: data,
  };
}

test("there are four tabs in order: Today, Talk, Plan, Me", () => {
  assert.deepEqual(TABS.map((t) => t.label), ["Today", "Talk", "Plan", "Me"]);
});

test("each tab selects on its own screen, and Me covers the screens reached from it", () => {
  assert.equal(tabForScreen("home"), "today");
  assert.equal(tabForScreen("chat"), "talk");
  assert.equal(tabForScreen("calendar"), "plan");
  for (const name of ["me", "profile", "intake", "looking", "lookup", "settings"]) {
    assert.equal(tabForScreen(name), "me", name);
  }
  assert.equal(tabForScreen("work"), null);
});

test("odd screen names select nothing and never throw", () => {
  for (const bad of [undefined, null, 5, {}, [], "", "nope"]) {
    assert.equal(tabForScreen(bad), null, String(bad));
  }
});

test("the bar is hidden only on the work screen", () => {
  assert.equal(tabBarVisible("work"), false);
  for (const name of ["home", "chat", "calendar", "me", "settings", "", undefined]) {
    assert.equal(tabBarVisible(name), true, String(name));
  }
});

test("screenForTab maps back, and unknown tabs open nothing", () => {
  assert.equal(screenForTab("talk"), "chat");
  assert.equal(screenForTab("plan"), "calendar");
  assert.equal(screenForTab("x"), null);
  assert.equal(screenForTab(undefined), null);
});

test("the welcome wording has no shame and no medical claim", () => {
  for (const text of [WELCOME_LINE, WELCOME_HIDE]) {
    assert.doesNotMatch(text, /ADHD|treat|attention|missed|behind|fail/i);
  }
});

test("welcome flag: unset, saved, damaged, other-version and refused storage all behave", () => {
  const storage = fakeStorage();
  assert.equal(loadWelcomeSeen(storage), false);
  assert.equal(saveWelcomeSeen(storage), true);
  assert.equal(loadWelcomeSeen(storage), true);
  assert.equal(loadWelcomeSeen(fakeStorage({ [STORAGE_KEY]: "{not json" })), false);
  assert.equal(loadWelcomeSeen(fakeStorage({ [STORAGE_KEY]: JSON.stringify({ schemaVersion: 1, welcome: { seen: "yes" } }) })), false);
  assert.equal(loadWelcomeSeen(fakeStorage({ [STORAGE_KEY]: JSON.stringify({ schemaVersion: 9, welcome: { seen: true } }) })), false);
  const refusing = { getItem() { throw new Error("no"); }, setItem() { throw new Error("no"); }, removeItem() {} };
  assert.equal(loadWelcomeSeen(refusing), false);
  assert.equal(saveWelcomeSeen(refusing), false);
  assert.equal(loadWelcomeSeen(null), false);
});

test("saving the welcome flag keeps other saved sections", () => {
  const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify({ schemaVersion: 1, tips: { stepTipsHidden: true } }) });
  saveWelcomeSeen(storage);
  const saved = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.equal(saved.tips.stepTipsHidden, true);
  assert.equal(saved.welcome.seen, true);
});
