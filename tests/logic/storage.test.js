import { test } from "node:test";
import assert from "node:assert/strict";
import { loadProfileState, saveProfile, STORAGE_KEY, BACKUP_KEY } from "../../js/storage.js";
import { emptyProfile, setGoals } from "../../js/logic/profile.js";

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
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
