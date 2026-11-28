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
