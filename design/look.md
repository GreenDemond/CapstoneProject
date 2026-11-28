# The look of the app (web)

Ben can change how the whole app looks by editing the values in the box at the very top of `css/styles.css` ("THE LOOK"). Nothing else needs to change. The values are in the same family as the iPhone app (sand paper, dark brown text, olive moss).

## What each value does

| Value | What it changes | Now |
|---|---|---|
| `--bg` | Page background | warm sand `#fbf6ec` |
| `--surface` | Cards and boxes you type in | `#fffdf8` |
| `--soft` | Quiet tinted panels (welcome note, options) | `#f3ecdb` |
| `--border` | Edges of buttons and boxes | `#8a8174` |
| `--line` | Faint card edges and dividers | `#ddd3bd` |
| `--text` / `--muted` | Main text / hints | brown / taupe |
| `--accent` / `--on-accent` | Main colour (buttons, headings, tick boxes) and the text on it | olive `#4f6b3a` / sand |
| `--clay` | Warm colour for the celebration line | `#b5653d` |
| `--radius`, `--radius-small`, `--radius-tiny` | Roundness of cards, buttons, small blocks | 0.9, 0.6, 0.4 rem |
| `--space-1` to `--space-4` | Gaps and padding | 0.5 to 1.5 rem |
| `--font-base`, `--font-small`, `--font-title`, `--font-step` | Text sizes | 1.05, 0.95, 1.75, 1.35 rem |
| `--shadow` | Soft lift under cards (`none` turns it off) | light |
| `--tap` | Smallest height of anything you press | 2.75rem |
| `--width`, `--width-wide` | Page width on phone / big screen | 40rem / 46rem |

Dark mode has its own colour values in the two dark blocks right under the first one. Change both blocks together (they are the same colours; one follows the device, one follows the app's own light/dark switch).

## Rules for any new colour

- Text needs at least 4.5 to 1 contrast against the colour behind it. Edges of things you press need 3 to 1.
- No red. Nothing that looks like a warning for lapses.
- Calendar group colours (Urgent, Significant and so on) are fixed pairs further down the file; change fill and text together or not at all.

Checked pairs (ratio): text on surface 14.0, text on soft 12.1, muted on soft 5.1, accent on soft 5.1, sand on accent 5.6; dark mode: text on surface 11.9, muted on soft 6.7, accent on soft 6.6, dark on accent 7.9.

## Example swaps

1. **Blue-grey accent:** `--accent: #2b6c8f;` (light) and `--accent: #8fbfdc;` (dark, both blocks). Ocean on sand is 5.6 to 1.
2. **Rounder and bigger:** `--radius: 1.3rem; --radius-small: 1rem; --font-base: 1.15rem;`
3. **Flatter and tighter:** `--shadow: none; --radius: 0.4rem; --radius-small: 0.3rem; --space-3: 0.75rem;`

## Buttons

- **Primary** (filled): the one main thing on a screen. Class `primary`.
- **Secondary** (outlined, the default): other choices.
- **Quiet** (looks like a link): leaving or hiding, such as Back to home, Hide this note, Show all my steps. Class `quiet`.

## Screenshots

`design/look-screens/before-*.png` is how it looked before this change (phone 390 wide and desktop 1280 wide: Today, filled Today, steps, Work, returning Today, Plan, Talk, Me). `after-*.png` is the same set after.
