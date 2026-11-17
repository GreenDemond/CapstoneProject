// Drawn confetti for finished items (design/calendar.md). No file, no sound, and
// nothing when the device asks for reduced motion. Pieces remove themselves.
const COLOURS = ["#e6893f", "#e7c04f", "#9cc3dd", "#4f6b3a", "#b5653d", "#c9d3b8"];
const PIECES = 36;
const LIFE_MS = 1800;

export function confetti() {
  if (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  const layer = document.createElement("div");
  layer.className = "confetti-layer";
  layer.setAttribute("aria-hidden", "true");
  for (let i = 0; i < PIECES; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = COLOURS[i % COLOURS.length];
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 160}px`);
    piece.style.setProperty("--spin", `${Math.random() * 720 - 360}deg`);
    piece.style.animationDelay = `${Math.random() * 0.2}s`;
    layer.append(piece);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), LIFE_MS);
}
