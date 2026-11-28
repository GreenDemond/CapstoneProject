# ADHD Focus App: Mac setup checklist

Status (2026-11-16): Steps 1, 2, 3, 4 and 6 are done. Homebrew, Node 26, Git 2.56 and Chrome are installed. Xcode 27.2 is installed and set up, with iOS 27.2 simulators. The web app is scaffolded and builds. Still to do: step 5 (Apple ID, in Xcode → Settings → Accounts) and step 7 (Chrome extension, later).

## 1. Install Homebrew (package manager)
Paste into Terminal:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
Then run the two "Next steps" lines it prints at the end.

## 2. Install Node.js and Git
brew install node git
Check: node -v (should be 22 or newer), npm -v

## 3. Install Google Chrome (for the extension)
Download from google.com/chrome, or: brew install --cask google-chrome

## 4. Install Xcode (only needed for the native iPhone app)
- Open the App Store, search Xcode, install (it is about 10 GB, plan for an hour).
- Open Xcode once and accept the license.
- Run: sudo xcodebuild -license accept

## 5. Apple ID for iPhone testing
- A free Apple ID lets you run the app on your own iPhone for 7 days at a time.
- The paid Apple Developer Program ($99 per year) is needed for TestFlight and for beta testers.

## 6. Create the web app (after steps 1 to 2)
cd ~/Documents/ADHD-Focus-App/web-app
npm create vite@latest . -- --template react-ts
npm install
npm run dev
Open the local address it prints (usually http://localhost:5173).

## 7. Chrome extension (later, stretch goal)
Once built, in Chrome go to chrome://extensions, turn on Developer mode, click "Load unpacked", and pick the chrome-extension folder.

## 8. Running the browser tests (Playwright)
The browser tests (`npm run test:browser`, part of `npm run check`) need a browser that Playwright can drive. Run this once in a normal Terminal (not inside a sandboxed agent session, which has no network):

cd ~/Documents/ben-project/CapstoneProject
npm ci --registry=https://registry.npmjs.org/
npx playwright install chromium

Then `npm run check` runs everything. Playwright's Chromium is a separate download, so it does not touch your normal Chrome.

Why this is needed: Playwright's browser is not installed on this Mac, and the installed Google Chrome aborts at launch (SIGABRT in macOS window-server registration) when started from inside an agent's sandbox, even with `--headless`. Chrome works from a normal Terminal, so a fallback without the download is a temporary config that sets `channel: "chrome"` on the `phone` and `desktop` projects, run with `npx playwright test -c <that file>`.

### Running the browser tests one at a time (sandboxes)
Where Chromium crashes after its first test (for example inside an agent sandbox), run `npm run test:browser:isolated`. It lists every test, runs each in its own Playwright run with `--single-process --no-zygote`, and prints PASS or FAIL per test and a total. Options: `npm run test:browser:isolated -- --project=phone tests/browser/tabs.spec.js`. It writes a temporary `pw-isolated-*.tmp.config.js` and deletes it afterwards. `npm run check` is unchanged.

## 9. Set up Gemini as an AI helper (for you and Ben only)
Gemini is for your device and Ben's only; classmates do not use an outside AI. Whatever is typed to the helper goes to Google, and an adult's Google account is needed. Do not type names or anything private.

### Quick version
1. Open the app, then Me, Settings, Add an AI helper.
2. Choose **Google Gemini**, then Next.
3. Follow **Get a key from Google in 3 steps** on screen (the **Open Google AI Studio** link opens Google's site), paste the key, then Next.
4. Leave the AI on `models/gemini-flash-lite-latest`, then Next, then Done when the check passes.
5. On Today, tick "Use Gemini to suggest steps", or choose Gemini in Talk under "Which AI helper?".

### If it doesn't work
- **A typo in the key:** under Me, Settings, choose the helper, use **Replace the key**, and paste it again.
- **Free quota or rate limit:** the app says Gemini's free quota is used for now. Wait a bit and try again.
- **The model name:** pick another name from the list. Do not guess one.
- **The browser blocked it:** try another browser window and check the internet connection.

For each one, tell the agent the exact line the app shows.

### Keep in mind
- The key is like a password. Never put it in the project folder or send it to anyone. If you keep a copy in a file, keep it outside the project folder (the project already ignores a file named `gemini-key`).
- To undo: Me, Settings, choose the helper, then **Forget key** or **Remove this helper**.
- The real-key check is in tests/manual-checks.md, under "Google Gemini quick setup".
- Older versions without the Google Gemini choice: use **Another service** and type `https://generativelanguage.googleapis.com/v1beta/openai` as the address.

### Status
Confirmed 2026-11-28 by the parent: Gemini works from the browser (Google accepts requests from the page, and the "How hard should the AI think?" setting does not break it). Still unverified: Google's current terms (the free tier may use prompts to improve its products), whether the `-latest` model name stays available, and the AI Studio link path and button names (written from memory; click the link once and tell the agent if Google shows something different).

## 10. Move your AI helpers to another browser (for the parent)
The app can save the AI helpers (name, address, AI, thinking effort) to a file and load them in another browser. Settings, then **Move your helpers**: **Save my AI helpers** and **Load AI helpers**.

- The normal file has no keys. It is safe to share with other adults, for example to set up a second device. Keys still need to be added there.
- A file with keys is locked with a passphrase the student picks (10 or more characters; a few words in a row works well). The passphrase is not stored and cannot be recovered. The locking is AES-GCM with a key made from the passphrase (PBKDF2, 600,000 rounds), using the browser's own tools.
- Honest limit: anyone who steals a file with keys can guess passphrases on their own computer with no limit on tries. A weak or common passphrase can be found. Keep that file private, delete it after use, and turn the key off in the AI account if the file is lost.
- Only load a file you made yourself. A file from someone else could point a helper at an address that reads what is typed. The app shows every address before anything is added and adds helpers without keys unless the file's passphrase is given.
- Loading only adds helpers. It never changes the helper in use or the ones already there. The data copy in Me and my data does not include AI settings and is unchanged.
