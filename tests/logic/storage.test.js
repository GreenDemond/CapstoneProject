import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loadProfileState, saveProfile, saveCalendarItems, loadCalendarItems, STORAGE_KEY, BACKUP_KEY,
  saveCompletionCounts, loadCompletionCounts, saveAiSettings, loadAiSettings, saveWork, loadWork,
  saveChatSettings, loadChatSettings, loadMoments, saveMoments, loadHelps, saveHelps, deleteRemembered, saveParked, loadParked, saveRecall, loadRecall, loadChats, saveChats, deleteAllChats, CHATS_KEY, CHATS_BACKUP_KEY,
} from "../../js/storage.js";
import { emptyProfile, setGoals } from "../../js/logic/profile.js";

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    _data: data,
  };
}

test("first visit: nothing saved yet gives an empty profile", () => {
  const result = loadProfileState(fakeStorage());
  assert.equal(result.status, "new");
  assert.deepEqual(result.profile, emptyProfile());
});

test("a saved profile comes back after a reload", () => {
  const storage = fakeStorage();
  const profile = setGoals(emptyProfile(), { today: "Read chapter 3" });
  assert.equal(saveProfile(profile, storage), true);
  const result = loadProfileState(storage);
  assert.equal(result.status, "ok");
  assert.equal(result.profile.goals.today, "Read chapter 3");
});

test("damaged data is kept under the backup key and the app starts fresh", () => {
  const storage = fakeStorage({ [STORAGE_KEY]: "{not json" });
  const result = loadProfileState(storage);
  assert.equal(result.status, "recovered");
  assert.deepEqual(result.profile, emptyProfile());
  assert.equal(storage._data.get(BACKUP_KEY), "{not json");
});

test("data with the wrong shape is treated as damaged", () => {
  const storage = fakeStorage({
    [STORAGE_KEY]: JSON.stringify({ schemaVersion: 1, profile: { goals: 5 } }),
  });
  assert.equal(loadProfileState(storage).status, "recovered");
});

test("data from a newer schema is not read as if it were this one", () => {
  const storage = fakeStorage({
    [STORAGE_KEY]: JSON.stringify({ schemaVersion: 2, profile: {} }),
  });
  assert.equal(loadProfileState(storage).status, "recovered");
});

test("a browser that refuses storage gives an empty profile and says so", () => {
  const blocked = {
    getItem() {
      throw new Error("denied");
    },
    setItem() {
      throw new Error("denied");
    },
  };
  assert.equal(loadProfileState(blocked).status, "unavailable");
  assert.equal(saveProfile(emptyProfile(), blocked), false);
  assert.equal(loadProfileState(null).status, "unavailable");
});

test("a second damaged copy does not overwrite the first backup", () => {
  const storage = fakeStorage({ [STORAGE_KEY]: "{first", [BACKUP_KEY]: "{first-backup" });
  loadProfileState(storage);
  assert.equal(storage._data.get(BACKUP_KEY), "{first-backup");
});

test("saving keeps other sections of the saved object", () => {
  const storage = fakeStorage({
    [STORAGE_KEY]: JSON.stringify({ schemaVersion: 1, profile: emptyProfile(), progress: { step: 3 } }),
  });
  assert.equal(saveProfile(setGoals(emptyProfile(), { week: "Essay" }), storage), true);
  const saved = JSON.parse(storage._data.get(STORAGE_KEY));
  assert.deepEqual(saved.progress, { step: 3 });
  assert.equal(saved.profile.goals.week, "Essay");
});

test("a save the browser does not confirm is reported as not saved", () => {
  const storage = fakeStorage();
  storage.setItem = () => {}; // accepts the call but stores nothing
  assert.equal(saveProfile(emptyProfile(), storage), false);
});

test("calendar items are saved beside the profile, and the profile survives", () => {
  const storage = fakeStorage();
  saveProfile(setGoals(emptyProfile(), { today: "Read" }), storage);
  assert.equal(saveCalendarItems([{ id: "a", title: "Essay", due: "2026-11-17T15:30" }], storage), true);
  assert.equal(loadProfileState(storage).profile.goals.today, "Read");
  assert.equal(loadCalendarItems(storage)[0].title, "Essay");
});

test("damaged calendar items are dropped one by one", () => {
  const storage = fakeStorage({
    [STORAGE_KEY]: JSON.stringify({
      schemaVersion: 1,
      calendar: { items: [{ id: "a", title: "Good", due: "2026-11-17T15:30" }, { id: 2 }, "nope"] },
    }),
  });
  const items = loadCalendarItems(storage);
  assert.deepEqual(items.map((i) => i.id), ["a"]);
});

const taskItem = { id: "a", title: "Essay", kind: "task", due: "2026-11-17T15:30" };
const workValue = { steps: [{ id: 1, text: "Read", done: false }], nextId: 2 };

function allSaves(storage) {
  return [
    saveProfile(emptyProfile(), storage),
    saveCalendarItems([taskItem], storage),
    saveCompletionCounts({ "2026-11-17": 2 }, storage),
    saveAiSettings({ services: [], chosenId: null }, storage),
    saveWork(workValue, "2026-11-17T10:00:00.000Z", storage),
    saveWork(null, undefined, storage),
    saveChatSettings({ guides: [], lengths: {} }, storage),
  ];
}

test("unparseable data: the first save works, the old text is backed up, loads work after", () => {
  const storage = fakeStorage({ [STORAGE_KEY]: "{not json" });
  assert.equal(saveProfile(setGoals(emptyProfile(), { today: "Read" }), storage), true);
  assert.equal(storage._data.get(BACKUP_KEY), "{not json");
  assert.equal(loadProfileState(storage).status, "ok");
  assert.equal(loadProfileState(storage).profile.goals.today, "Read");
  assert.equal(saveCalendarItems([taskItem], storage), true);
  assert.equal(loadCalendarItems(storage).length, 1);
});

test("unparseable data reads as empty for every section", () => {
  const storage = fakeStorage({ [STORAGE_KEY]: "[1,2" });
  assert.deepEqual(loadCalendarItems(storage), []);
  assert.deepEqual(loadCompletionCounts(storage), {});
  assert.deepEqual(loadAiSettings(storage), { services: [], chosenId: null });
  assert.deepEqual(loadWork(storage), { work: null, savedOn: null });
  assert.deepEqual(loadChatSettings(storage), loadChatSettings(fakeStorage()));
});

test("a stored value that is not an object counts as damaged", () => {
  const storage = fakeStorage({ [STORAGE_KEY]: "42" });
  assert.equal(saveProfile(emptyProfile(), storage), true);
  assert.equal(storage._data.get(BACKUP_KEY), "42");
});

test("an existing backup is never overwritten", () => {
  const storage = fakeStorage({ [STORAGE_KEY]: "{second damage", [BACKUP_KEY]: "first damage" });
  assert.equal(saveProfile(emptyProfile(), storage), true);
  assert.equal(storage._data.get(BACKUP_KEY), "first damage");
  const loaded = fakeStorage({ [STORAGE_KEY]: "{bad", [BACKUP_KEY]: "first damage" });
  loadProfileState(loaded);
  assert.equal(loaded._data.get(BACKUP_KEY), "first damage");
});

test("data from another version is backed up first, then the app starts fresh and saves work", () => {
  const raw = JSON.stringify({ schemaVersion: 2, profile: { x: 1 }, work: { y: 2 } });
  const storage = fakeStorage({ [STORAGE_KEY]: raw });
  assert.equal(saveProfile(setGoals(emptyProfile(), { today: "Read" }), storage), true);
  assert.equal(storage._data.get(BACKUP_KEY), raw);
  assert.equal(loadProfileState(storage).profile.goals.today, "Read");
  assert.equal(saveWork(workValue, undefined, storage), true);
});

test("data from another version is never overwritten when a different backup is already kept", () => {
  const raw = JSON.stringify({ schemaVersion: 2, profile: { x: 1 } });
  const storage = fakeStorage({ [STORAGE_KEY]: raw, [BACKUP_KEY]: "older copy" });
  assert.deepEqual(allSaves(storage), [false, false, false, false, false, false, false]);
  assert.equal(storage._data.get(STORAGE_KEY), raw);
  assert.equal(storage._data.get(BACKUP_KEY), "older copy");
});

test("data with no schema number is treated the same way", () => {
  const raw = JSON.stringify({ profile: {} });
  const storage = fakeStorage({ [STORAGE_KEY]: raw });
  assert.equal(saveProfile(emptyProfile(), storage), true);
  assert.equal(storage._data.get(BACKUP_KEY), raw);
});

test("unreadable text never blocks saving, even when a backup already exists", () => {
  const storage = fakeStorage({ [STORAGE_KEY]: "{bad again", [BACKUP_KEY]: "first damage" });
  assert.equal(saveProfile(emptyProfile(), storage), true);
  assert.equal(storage._data.get(BACKUP_KEY), "first damage");
});

test("loading other-version data backs it up once and writes nothing to the main key", () => {
  const raw = JSON.stringify({ schemaVersion: 2, profile: {} });
  const storage = fakeStorage({ [STORAGE_KEY]: raw });
  assert.equal(loadProfileState(storage).status, "recovered");
  assert.equal(storage._data.get(STORAGE_KEY), raw);
  assert.equal(storage._data.get(BACKUP_KEY), raw);
  assert.deepEqual(loadCalendarItems(storage), []);
});

test("saving one section keeps all the others", () => {
  const storage = fakeStorage();
  saveProfile(setGoals(emptyProfile(), { today: "Read" }), storage);
  saveCalendarItems([taskItem], storage);
  saveCompletionCounts({ "2026-11-17": 2 }, storage);
  saveAiSettings({ services: [], chosenId: null }, storage);
  saveWork(workValue, "2026-11-17T10:00:00.000Z", storage);
  const chat = loadChatSettings(storage);
  saveChatSettings(chat, storage);
  // Save each again in turn; nothing else may change.
  saveProfile(setGoals(emptyProfile(), { today: "Write" }), storage);
  saveCalendarItems([taskItem], storage);
  assert.equal(loadProfileState(storage).profile.goals.today, "Write");
  assert.equal(loadCalendarItems(storage).length, 1);
  assert.deepEqual(loadCompletionCounts(storage), { "2026-11-17": 2 });
  assert.equal(loadWork(storage).work.nextId, 2);
  assert.deepEqual(loadChatSettings(storage), chat);
  assert.deepEqual(loadAiSettings(storage), { services: [], chosenId: null });
});

test("items and counts each keep the other half", () => {
  const storage = fakeStorage();
  saveCalendarItems([taskItem], storage);
  saveCompletionCounts({ "2026-11-17": 3 }, storage);
  saveCalendarItems([], storage);
  assert.deepEqual(loadCompletionCounts(storage), { "2026-11-17": 3 });
  saveCalendarItems([taskItem], storage);
  saveCompletionCounts({}, storage);
  assert.equal(loadCalendarItems(storage).length, 1);
});

test("saving null removes only that section", () => {
  const storage = fakeStorage();
  saveProfile(setGoals(emptyProfile(), { today: "Read" }), storage);
  saveWork(workValue, "2026-11-17T10:00:00.000Z", storage);
  assert.equal(saveWork(null, undefined, storage), true);
  assert.equal(loadWork(storage).work, null);
  assert.equal(loadProfileState(storage).profile.goals.today, "Read");
  assert.equal("work" in JSON.parse(storage._data.get(STORAGE_KEY)), false);
});

test("storage whose setItem throws: saves return false", () => {
  const storage = fakeStorage();
  storage.setItem = () => {
    throw new Error("quota");
  };
  assert.deepEqual(allSaves(storage), [false, false, false, false, false, false, false]);
});

test("storage whose getItem throws: saves return false and loads give defaults", () => {
  const storage = fakeStorage();
  storage.getItem = () => {
    throw new Error("denied");
  };
  assert.deepEqual(allSaves(storage), [false, false, false, false, false, false, false]);
  assert.equal(loadProfileState(storage).status, "unavailable");
  assert.deepEqual(loadCalendarItems(storage), []);
  assert.deepEqual(loadCompletionCounts(storage), {});
  assert.deepEqual(loadWork(storage), { work: null, savedOn: null });
});

test("loading damaged data never writes the main key, whichever loader runs", () => {
  for (const raw of ["{bad", "null", "[1]", "42"]) {
    const storage = fakeStorage({ [STORAGE_KEY]: raw });
    loadProfileState(storage);
    loadCalendarItems(storage);
    loadCompletionCounts(storage);
    loadAiSettings(storage);
    loadWork(storage);
    loadChatSettings(storage);
    assert.equal(storage._data.get(STORAGE_KEY), raw, raw);
  }
});

test("null and arrays count as damaged, so the first save starts fresh", () => {
  for (const raw of ["null", "[1]"]) {
    const storage = fakeStorage({ [STORAGE_KEY]: raw });
    assert.equal(saveProfile(emptyProfile(), storage), true, raw);
    assert.equal(storage._data.get(BACKUP_KEY), raw);
  }
});

test("if the backup cannot be written, unreadable text is still replaced but another version is not", () => {
  const failingBackup = (initial) => {
    const storage = fakeStorage(initial);
    const setItem = storage.setItem;
    storage.setItem = (key, value) => {
      if (key === BACKUP_KEY) throw new Error("full");
      setItem(key, value);
    };
    return storage;
  };
  assert.equal(saveProfile(emptyProfile(), failingBackup({ [STORAGE_KEY]: "{bad" })), true);
  const raw = JSON.stringify({ schemaVersion: 2, profile: {} });
  const other = failingBackup({ [STORAGE_KEY]: raw });
  assert.equal(saveProfile(emptyProfile(), other), false);
  assert.equal(other._data.get(STORAGE_KEY), raw);
});

test("a usable store with no profile yet still saves and loads the other sections", () => {
  const storage = fakeStorage();
  saveCalendarItems([taskItem], storage);
  assert.equal(loadProfileState(storage).status, "new", "nothing is damaged, so no warning");
  assert.equal(storage._data.get(BACKUP_KEY), undefined);
  assert.equal(loadCalendarItems(storage).length, 1);
  assert.equal(saveProfile(emptyProfile(), storage), true);
  assert.equal(loadCalendarItems(storage).length, 1);
});

// Saved chats (design/chat-history.md): their own key, so they never touch the main one.
const oneChat = { id: "a", kind: "essay", title: "Essay · hi", startedOn: "2026-11-17T10:00:00.000Z", usedOn: "2026-11-17T10:00:00.000Z", items: [{ who: "you", text: "hi" }] };

test("chats are saved under their own key and the main key is not touched", () => {
  const storage = fakeStorage();
  saveProfile(setGoals(emptyProfile(), { today: "Read" }), storage);
  const before = storage._data.get(STORAGE_KEY);
  assert.equal(saveChats([oneChat], storage), true);
  assert.equal(storage._data.get(STORAGE_KEY), before);
  assert.equal(JSON.parse(storage._data.get(CHATS_KEY)).schemaVersion, 1);
  assert.deepEqual(loadChats(storage), [oneChat]);
  assert.equal(loadProfileState(storage).profile.goals.today, "Read");
});

test("nothing saved, no storage, or a failing read gives no chats", () => {
  assert.deepEqual(loadChats(fakeStorage()), []);
  assert.deepEqual(loadChats(null), []);
  const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.deepEqual(loadChats(throwing), []);
  assert.equal(saveChats([oneChat], throwing), false);
  assert.equal(saveChats([oneChat], null), false);
});

test("a chat save the browser does not confirm is reported as not saved, and a full store does not stop the main save", () => {
  const storage = fakeStorage();
  const setItem = storage.setItem;
  storage.setItem = (key, value) => {
    if (key === CHATS_KEY) throw new Error("quota");
    setItem(key, value);
  };
  assert.equal(saveChats([oneChat], storage), false);
  assert.equal(saveProfile(emptyProfile(), storage), true);
  storage.setItem = (key, value) => (key === CHATS_KEY ? undefined : setItem(key, value));
  assert.equal(saveChats([oneChat], storage), false);
});

test("damaged chat text is backed up once under its own backup key and a fresh object is saved", () => {
  const storage = fakeStorage({ [CHATS_KEY]: "{not json" });
  assert.deepEqual(loadChats(storage), []);
  assert.equal(storage._data.get(CHATS_BACKUP_KEY), "{not json");
  assert.equal(storage._data.has(BACKUP_KEY), false);
  assert.equal(saveChats([oneChat], storage), true);
  assert.deepEqual(loadChats(storage), [oneChat]);
  assert.equal(storage._data.get(CHATS_BACKUP_KEY), "{not json");
  storage._data.set(CHATS_KEY, "[also bad");
  assert.equal(saveChats([], storage), true);
  assert.equal(storage._data.get(CHATS_BACKUP_KEY), "{not json"); // the first copy is kept
});

test("chats from another version are backed up, not lost, and reading them gives none", () => {
  const other = JSON.stringify({ schemaVersion: 9, chats: [oneChat] });
  const storage = fakeStorage({ [CHATS_KEY]: other });
  assert.deepEqual(loadChats(storage), []);
  assert.equal(storage._data.get(CHATS_BACKUP_KEY), other);
});

test("bad chats inside good data are dropped one by one", () => {
  const storage = fakeStorage({ [CHATS_KEY]: JSON.stringify({ schemaVersion: 1, chats: [oneChat, { id: 3 }, "x", null] }) });
  assert.deepEqual(loadChats(storage), [oneChat]);
  assert.deepEqual(loadChats(fakeStorage({ [CHATS_KEY]: JSON.stringify({ schemaVersion: 1, chats: "nope" }) })), []);
});

test("the kind of work is saved with the steps and read back; a bad kind is ignored", () => {
  const storage = fakeStorage();
  assert.equal(saveWork({ ...workValue, kind: "essay" }, "2026-11-17T10:00:00.000Z", storage), true);
  assert.equal(loadWork(storage).work.kind, "essay");
  saveWork({ ...workValue, kind: "bogus" }, "2026-11-17T10:00:00.000Z", storage);
  assert.equal("kind" in loadWork(storage).work, false);
  saveWork(workValue, "2026-11-17T10:00:00.000Z", storage);
  assert.deepEqual(loadWork(storage).work, workValue);
});

test("chats from another version are overwritten even when a different backup already exists", () => {
  const other = JSON.stringify({ schemaVersion: 9, chats: [oneChat] });
  const storage = fakeStorage({ [CHATS_KEY]: other, [CHATS_BACKUP_KEY]: "an older copy" });
  assert.equal(saveChats([oneChat], storage), true);
  assert.deepEqual(loadChats(storage), [oneChat]);
  assert.equal(storage._data.get(CHATS_BACKUP_KEY), "an older copy");
});

test("the main key still refuses to overwrite other-version data when its backup is taken", () => {
  const other = JSON.stringify({ schemaVersion: 9, profile: {} });
  const storage = fakeStorage({ [STORAGE_KEY]: other, [BACKUP_KEY]: "an older copy" });
  assert.equal(saveProfile(emptyProfile(), storage), false);
  assert.equal(storage._data.get(STORAGE_KEY), other);
});

test("deleteAllChats empties the list and removes the chats backup", () => {
  const storage = fakeStorage({ [CHATS_KEY]: "{not json" });
  loadChats(storage); // makes the backup
  assert.equal(storage._data.has(CHATS_BACKUP_KEY), true);
  assert.equal(deleteAllChats(storage), true);
  assert.deepEqual(loadChats(storage), []);
  assert.equal(storage._data.has(CHATS_BACKUP_KEY), false);
  assert.equal(deleteAllChats(null), false);
});

test("finished-step moments and help marks save, reload, and keep other sections", () => {
  const storage = fakeStorage();
  assert.equal(saveProfile(setGoals(emptyProfile(), { today: "Read" }), storage), true);
  const moments = [{ id: 1, kind: "done", date: "2026-11-20T10:00:00.000Z" }];
  const helps = [{ id: 1, answer: "yes", timer: 12, date: "2026-11-20T10:00:00.000Z" }];
  assert.equal(saveMoments(moments, storage), true);
  assert.equal(saveHelps(helps, storage), true);
  assert.deepEqual(loadMoments(storage), moments);
  assert.deepEqual(loadHelps(storage), helps);
  assert.equal(loadProfileState(storage).profile.goals.today, "Read");
  assert.equal(saveMoments([], storage), true);
  assert.deepEqual(loadMoments(storage), []);
  assert.equal(JSON.parse(storage._data.get(STORAGE_KEY)).moments, undefined);
});

test("damaged moments and help marks load as empty lists", () => {
  const damaged = fakeStorage({ [STORAGE_KEY]: "{not json" });
  assert.deepEqual(loadMoments(damaged), []);
  assert.deepEqual(loadHelps(damaged), []);
  const wrong = fakeStorage({ [STORAGE_KEY]: JSON.stringify({ schemaVersion: 1, moments: "x", helps: { a: 1 } }) });
  assert.deepEqual(loadMoments(wrong), []);
  assert.deepEqual(loadHelps(wrong), []);
  assert.deepEqual(loadMoments(null), []);
  assert.deepEqual(loadHelps(null), []);
});

test("deleteRemembered clears the four sections and keeps the profile", () => {
  const storage = fakeStorage();
  saveProfile(setGoals(emptyProfile(), { today: "Read" }), storage);
  saveParked([{ id: 1, text: "song", date: "" }], storage);
  saveRecall([{ id: 1, answer: "a fact", date: "" }], storage);
  saveHelps([{ id: 1, answer: "no", timer: 0, date: "" }], storage);
  saveMoments([{ id: 1, kind: "done", date: "2026-11-20T10:00:00.000Z" }], storage);
  assert.equal(deleteRemembered(storage), true);
  assert.deepEqual(loadParked(storage), []);
  assert.deepEqual(loadRecall(storage), []);
  assert.deepEqual(loadHelps(storage), []);
  assert.deepEqual(loadMoments(storage), []);
  assert.equal(loadProfileState(storage).profile.goals.today, "Read");
});

test("deleteRemembered reports false when the browser refuses to save", () => {
  const storage = fakeStorage();
  storage.setItem = () => { throw new Error("full"); };
  assert.equal(deleteRemembered(storage), false);
});
