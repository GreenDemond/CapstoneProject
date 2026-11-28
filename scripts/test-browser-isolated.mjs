// Runs each Playwright browser test in its own Playwright run.
// Needed where Chromium only survives one test per browser (agent sandboxes).
// Usage: npm run test:browser:isolated -- [--project=phone|desktop] [file-filter]
import { spawnSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

let project = "";
let filter = "";
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--project=")) project = arg.slice("--project=".length);
  else if (!arg.startsWith("-")) filter = arg;
}

const configName = `pw-isolated-${process.pid}.tmp.config.js`;
const configPath = join(root, configName);
writeFileSync(
  configPath,
  [
    'import base from "./playwright.config.js";',
    "export default {",
    "  ...base,",
    "  workers: 1,",
    "  fullyParallel: false,",
    "  projects: base.projects.map((p) => ({",
    "    ...p,",
    '    use: { ...p.use, launchOptions: { args: ["--single-process", "--no-zygote"] } },',
    "  })),",
    "};",
    "",
  ].join("\n"),
);

function cleanup() {
  try {
    unlinkSync(configPath);
  } catch {
    // already gone
  }
}
process.on("exit", cleanup);
process.on("SIGINT", () => process.exit(130));

function walkSuites(suites, out) {
  for (const suite of suites) {
    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) {
        out.push({ file: spec.file, line: spec.line, title: spec.title, project: t.projectName });
      }
    }
    walkSuites(suite.suites || [], out);
  }
}

const listArgs = ["playwright", "test", "--config", configName, "--list", "--reporter=json"];
if (project) listArgs.push(`--project=${project}`);
if (filter) listArgs.push(filter);
const listed = spawnSync(npx, listArgs, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
let report;
try {
  report = JSON.parse(listed.stdout);
} catch {
  console.error("Could not list tests.\n" + (listed.stderr || listed.stdout));
  process.exit(2);
}
const tests = [];
walkSuites(report.suites || [], tests);
if (tests.length === 0) {
  console.error("No tests matched.");
  process.exit(2);
}

const failed = [];
let passed = 0;
tests.forEach((t, i) => {
  const label = `${t.file}:${t.line} [${t.project}] ${t.title}`;
  const run = spawnSync(
    npx,
    ["playwright", "test", "--config", configName, `${t.file}:${t.line}`, `--project=${t.project}`, "--reporter=line"],
    { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const ok = run.status === 0;
  if (ok) passed += 1;
  else failed.push(label);
  console.log(`${ok ? "PASS" : "FAIL"} (${i + 1}/${tests.length}) ${label}`);
  if (!ok) console.log((run.stdout || "").split("\n").slice(-25).join("\n"));
});

console.log(`\n${passed} passed, ${failed.length} failed, ${tests.length} total`);
for (const f of failed) console.log(`  FAILED: ${f}`);
process.exit(failed.length ? 1 : 0);
