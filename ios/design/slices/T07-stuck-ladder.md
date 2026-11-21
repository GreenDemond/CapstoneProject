# T07 Stuck ladder, without AI
Status: built 2026-11-20 (compile-checked; UI tests not run). Built in the same commit as T06 because the work screen opens it.

## What the student sees and does
1. Tapping Stuck opens a sheet: "Stuck is okay." The first built-in hint is already shown.
2. **Another hint** shows the next one, in order. After the last: "That's all the hints I have."
3. After two hints (or when there are none left) **Ask a person** appears: three boxes ("I'm on:" with the step filled in, "I tried:", "I don't get:") and **Copy my question**. With all three empty, a calm line says to write a little first and there is no copy button.
4. Look it up and Talk it through are shown as quiet lines, "Not ready yet in this version." (T08 and T12).
5. **Back to my step** closes the sheet.

## Research link
`design/02` 2.8; `DECISIONS.md` P6; `research/06` A5, A6 (not re-read in this session; hints and the three-part question follow `design/02`).

## What it stores
Nothing. The ladder (hints shown, what was typed) is kept in memory for the step, so leaving and returning during the same run of the app keeps it.

## What leaves the phone
Nothing. Copy puts the question on the phone's clipboard only when the student taps it.

## Differs from the web app
Ask a person is new.

## Tests
Logic (`AppModelTests`): hints in order and none repeated after the last; ask-a-person only after two hints; empty question gives none; three-part wording; Stuck never changes the steps and the ladder is kept.
UI (`StuckUITests`): ladder to a copied question; empty question cannot be copied. Written and compiled, not run.
Network: no file in the ladder opens a connection (`grep -rn "URLSession" FocusKit/Sources App` at this commit finds nothing).

## Unverified
Wording read by a student; the clipboard copy on a device.

## Gates
No Advisor available; self-review only. Gate 2 owed (wording).
