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
Who it is for: your device and Ben's only. Classmates do not use an outside AI. Whatever is typed to the helper goes to Google. Google's free tier may use prompts to improve its products, and an adult Google account is needed (check Google's current terms; this was not verified). Do not type names or anything private.

1. An adult gets a key. Open aistudio.google.com, sign in with the adult's Google account, choose Get API key, then Create API key, and copy it. Google changes the page, so the button names may differ.
2. The key is like a password. Never put it in the project folder or send it to anyone. If you keep a copy in a file, keep it outside the project folder (the project already ignores a file named `gemini-key`).
3. In the app, open the Me tab, then Settings, then Add an AI helper. Choose Another service.
4. Under "Its web address" type `https://generativelanguage.googleapis.com/v1beta/openai`, then Next.
5. Under "Your key" paste the key, then Next. The app looks up Google's list of models.
6. Under "Pick an AI" the list starts on `models/gemini-flash-lite-latest`; leave it or choose another from the list. Do not guess a name. Optionally type a name such as Gemini under "Name this helper (optional)". Next, then Done once the check passes.
7. To use it: on Today, tick "Use Gemini to suggest steps" (it shows the helper's name), then press Suggest some to start. In Talk, the "Which AI helper?" menu chooses which helper answers.
8. If something goes wrong, the app shows a plain line. Likely causes: a mistyped key, the free quota or rate limit reached (wait and try again), or the browser blocking the request. Whether Google accepts requests straight from a web page, and how it treats the "How hard should the AI think?" setting, have not been tried with a real key. Tell the agent the exact line the app shows.
9. To undo: Me, Settings, choose the helper, then "Forget key" or "Remove this helper".

The real-key check is in tests/manual-checks.md, under "Google Gemini address".
