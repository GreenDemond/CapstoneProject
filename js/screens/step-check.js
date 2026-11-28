// Shows the word-matching check of the steps against the assignment's lines (design/check-steps-w5.md).
// Student text is only ever put on screen with textContent (DECISIONS T11).
import { checkSteps, CHECK_BASIS, CHECK_ALL_COVERED, CHECK_QUESTION } from "../logic/step-check.js";
import { el } from "../ui/dom.js";

// Fills holder with the result, or leaves it empty when there is nothing to check.
export function fillCheck(holder, lines, steps) {
  holder.replaceChildren();
  const result = checkSteps(lines, steps);
  if (result === null) {
    return;
  }
  if (result.open.length === 0) {
    holder.append(el("p", CHECK_ALL_COVERED));
  } else {
    const list = el("ul", undefined, { class: "check-list" });
    for (const line of result.open) {
      const item = el("li");
      item.append(el("span", `The assignment says "${line}"`), el("br"), el("strong", CHECK_QUESTION));
      list.append(item);
    }
    holder.append(list);
  }
  holder.append(el("p", CHECK_BASIS, { class: "hint" }));
}
