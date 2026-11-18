// Shared helpers for building screens with plain DOM calls (design/review-plan-2026-11-17.md, step 12).
// Text is always set with textContent, never as HTML (DECISIONS T11).

export function el(tag, text, attrs = {}) {
  const node = document.createElement(tag);
  if (text !== undefined) {
    node.textContent = text;
  }
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, value);
  }
  return node;
}

// A live region created already filled is often not read out. Create it empty, fill it a frame later.
export function announce(node, text) {
  requestAnimationFrame(() => {
    node.textContent = text;
  });
}

export function button(text, onClick, className = "") {
  const node = el("button", text, { type: "button" });
  if (className) {
    node.className = className;
  }
  node.addEventListener("click", onClick);
  return node;
}

export function labelled(text, control, id) {
  const label = el("label", text, { for: id });
  return [label, control];
}
