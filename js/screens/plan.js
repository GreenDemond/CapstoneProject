// The Plan tab's steps and saved thoughts (design/plan-tab-w13.md), drawn under the calendar. Reads what is
// saved on this device each time it draws. Student text is set with textContent. Needs no AI.
import { loadWork, loadParked, loadRecall, saveParked, saveRecall } from "../storage.js";
import { removeItem } from "../logic/work-extras.js";
import { shortDate } from "../logic/looking-back.js";
import {
  planSteps, savedThoughts, STEPS_HEADING, STEPS_EMPTY, STEPS_MAKE, STEP_DONE_MARK,
  THOUGHTS_HEADING, THOUGHT_TAKE_OUT, THOUGHT_ASK, THOUGHT_YES, THOUGHT_NO,
} from "../logic/plan.js";
import { el, button } from "../ui/dom.js";

const FOCUS = "#plan-extras"; // after a change, focus goes to the box so it is not lost
let askingKey = null; // the saved thought that is waiting for a second tap

// container: where to draw. redraw: draws the whole screen again. goHome: shows the home screen.
// changed: told after a thought is taken out, so the home screen can update its list.
export function renderPlanExtras(container, { redraw, goHome, changed }) {
  const steps = planSteps(loadWork().work);
  const thoughts = savedThoughts(loadParked(), loadRecall());
  const box = el("div", undefined, { class: "plan-extras", id: "plan-extras" });
  box.append(el("h3", STEPS_HEADING));
  box.tabIndex = -1;
  if (steps.length === 0) {
    box.append(el("p", STEPS_EMPTY, { class: "hint" }));
    if (thoughts.length === 0) box.append(button(STEPS_MAKE, goHome));
  } else {
    const list = el("ol", undefined, { class: "plan-steps" });
    for (const step of steps) {
      const li = el("li", step.text);
      if (step.done) li.append(" ", el("span", `(${STEP_DONE_MARK})`, { class: "hint" }));
      list.append(li);
    }
    box.append(list);
  }
  if (thoughts.length > 0) {
    box.append(el("h3", THOUGHTS_HEADING, { id: "plan-thoughts-heading", tabindex: "-1" }));
    const list = el("ul", undefined, { class: "looking-list", id: "plan-thoughts" });
    for (const thought of thoughts) {
      const li = el("li");
      const when = shortDate(thought.date);
      li.append(el("span", when ? `${thought.text} (${when})` : thought.text), " ");
      if (askingKey === thought.key) {
        li.append(el("span", THOUGHT_ASK), " ");
        li.append(button(THOUGHT_YES, () => takeOut(thought, { redraw, changed }), "small"));
        li.append(button(THOUGHT_NO, () => { askingKey = null; redraw(FOCUS); }, "small"));
      } else {
        li.append(button(THOUGHT_TAKE_OUT, () => { askingKey = thought.key; redraw(FOCUS); }, "small"));
      }
      list.append(li);
    }
    box.append(list);
  }
  container.append(box);
}

function takeOut(thought, { redraw, changed }) {
  askingKey = null;
  if (thought.kind === "parked") {
    saveParked(removeItem(loadParked(), thought.id));
  } else {
    saveRecall(removeItem(loadRecall(), thought.id));
  }
  changed?.();
  redraw(FOCUS);
}

// Called when the Plan tab opens, so an old question does not wait there.
export function resetPlanExtras() {
  askingKey = null;
}
