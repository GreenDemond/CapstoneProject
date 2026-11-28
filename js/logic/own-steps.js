// Writing my own steps as the main path (design/own-steps-w10.md). Pure logic: no browser APIs.
// The student types the steps. Nothing here writes a step for them, and no AI is involved.
import { limitPaste } from "./clean-text.js";
import { cleanSteps } from "./step-editor.js";

export const NEED_ONE_STEP = "Add one step first. It can be tiny.";
export const OWN_EDITOR_TITLE = "Write my steps";
export const OWN_EDITOR_HINT =
  "What is the first small thing you could do? Type it in the box. It can be tiny. Add more if you like. Nothing is saved until you press Start.";
export const OWN_STEPS_HEADING = "Your steps";
export const STARTER_STEPS_HEADING = "Here's a start";
export const PASTED_HEADING = "What you pasted";
export const OWN_DONE_LABEL = "Done writing";
export const OWN_LEAVE_LABEL = "Back to the paste box";

// What the editor starts with: the assignment text (optional, kept to the paste limit) and one empty box.
// The kind of work and the step count are not needed on this path.
export function ownStart(rawText) {
  const { text, truncated } = limitPaste(rawText);
  return { text, truncated, draft: [""] };
}

// The line to show when the student tries to go on with no step written, or null when they can.
export function ownMissing(draft) {
  return Array.isArray(draft) && cleanSteps(draft).length > 0 ? null : NEED_ONE_STEP;
}
