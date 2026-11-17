// The student's profile: goals and "What got in the way?" notes (design/profile.md).
// Pure logic: no browser APIs. Text is plain text; nothing here judges the student.

export const GOAL_KEYS = ["today", "week", "month", "year"];
export const MAX_TEXT = 500;

export function emptyProfile() {
  return {
    goals: { today: "", week: "", month: "", year: "" },
    gotInTheWay: [],
  };
}

function cleanText(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, MAX_TEXT);
}

// Returns a usable profile, or null if the stored shape is not what we expect.
export function normalizeProfile(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  if (!raw.goals || typeof raw.goals !== "object" || !Array.isArray(raw.gotInTheWay)) {
    return null;
  }
  const profile = emptyProfile();
  for (const key of GOAL_KEYS) {
    const value = raw.goals[key];
    if (value !== undefined && typeof value !== "string") {
      return null;
    }
    profile.goals[key] = cleanText(value ?? "");
  }
  // A damaged note is dropped on its own; the good notes and goals are kept.
  for (const note of raw.gotInTheWay) {
    if (
      note &&
      typeof note.id === "string" &&
      typeof note.text === "string" &&
      typeof note.savedOn === "string"
    ) {
      profile.gotInTheWay.push({ id: note.id, text: cleanText(note.text), savedOn: note.savedOn });
    }
  }
  return profile;
}

export function setGoals(profile, goals) {
  const next = { ...profile, goals: { ...profile.goals } };
  for (const key of GOAL_KEYS) {
    next.goals[key] = cleanText(goals?.[key] ?? "");
  }
  return next;
}

// Adds a note. Blank notes are ignored. Only the day is kept (YYYY-MM-DD), not the
// time, so the profile is not a log of when the student lost focus.
export function addNote(profile, text, day, id) {
  const cleaned = cleanText(text);
  if (cleaned === "") {
    return profile;
  }
  return {
    ...profile,
    gotInTheWay: [...profile.gotInTheWay, { id, text: cleaned, savedOn: day }],
  };
}

export function deleteNote(profile, id) {
  return { ...profile, gotInTheWay: profile.gotInTheWay.filter((note) => note.id !== id) };
}

// Newest first, for the screen. Notes are kept in the order they were added.
export function notesNewestFirst(profile) {
  return [...profile.gotInTheWay].reverse();
}
