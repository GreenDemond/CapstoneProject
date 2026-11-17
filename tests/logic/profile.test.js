import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyProfile,
  normalizeProfile,
  setGoals,
  addNote,
  deleteNote,
  notesNewestFirst,
  MAX_TEXT,
} from "../../js/logic/profile.js";

test("a blank goal or blank note is not kept", () => {
  const profile = emptyProfile();
  assert.equal(addNote(profile, "   \n ", "2026-11-16", "a"), profile);
  assert.equal(setGoals(profile, { today: "  " }).goals.today, "");
});

test("goals are trimmed and kept for each time scale", () => {
  const profile = setGoals(emptyProfile(), { today: " Finish the essay ", year: "Pass chemistry" });
  assert.equal(profile.goals.today, "Finish the essay");
  assert.equal(profile.goals.year, "Pass chemistry");
  assert.equal(profile.goals.week, "");
});

test("long text is cut to the limit, not rejected", () => {
  const profile = setGoals(emptyProfile(), { week: "x".repeat(MAX_TEXT + 50) });
  assert.equal(profile.goals.week.length, MAX_TEXT);
});

test("notes can be added, shown newest first, and deleted", () => {
  let profile = addNote(emptyProfile(), "Phone buzzed", "2026-11-14", "n1");
  profile = addNote(profile, "Got lost in a video", "2026-11-15", "n2");
  profile = addNote(profile, "Too tired after lunch", "2026-11-16", "n3");
  assert.deepEqual(
    notesNewestFirst(profile).map((note) => note.id),
    ["n3", "n2", "n1"],
  );
  profile = deleteNote(profile, "n3");
  assert.equal(profile.gotInTheWay.length, 2);
});

test("a saved profile that is the right shape is kept as it is", () => {
  const profile = normalizeProfile({
    goals: { today: "A", week: "B", month: "", year: "" },
    gotInTheWay: [{ id: "n1", text: "Phone", savedOn: "2026-11-16" }],
  });
  assert.equal(profile.goals.today, "A");
  assert.equal(profile.gotInTheWay[0].text, "Phone");
});

test("a wrong top-level shape is refused, not guessed at", () => {
  assert.equal(normalizeProfile(null), null);
  assert.equal(normalizeProfile([]), null);
  assert.equal(normalizeProfile({ goals: { today: 5 }, gotInTheWay: [] }), null);
});

test("one damaged note is dropped, and the good notes and goals are kept", () => {
  const profile = normalizeProfile({
    goals: { today: "Read" },
    gotInTheWay: [
      { id: "a", text: "Phone", savedOn: "2026-11-16" },
      { id: 7, text: "broken" },
      { id: "c", text: "Tired", savedOn: "2026-11-16" },
    ],
  });
  assert.equal(profile.goals.today, "Read");
  assert.deepEqual(profile.gotInTheWay.map((n) => n.id), ["a", "c"]);
});

test("notes store the day only, not the time", () => {
  const profile = addNote(emptyProfile(), "Phone", "2026-11-16", "n1");
  assert.equal(profile.gotInTheWay[0].savedOn, "2026-11-16");
  assert.equal("savedAt" in profile.gotInTheWay[0], false);
});
