// Builds the folder that goes on the web server: only what the app needs.
// Allowlist based: anything not listed here is never copied.
import { cpSync, rmSync, mkdirSync, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILES = ["index.html", "manifest.webmanifest"]; // copied when present
const DIRS = ["css", "js", "icons"]; // copied when present

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function relativeRefs(file) {
  const text = readFileSync(file, "utf8");
  const refs = [];
  if (file.endsWith(".js")) {
    for (const m of text.matchAll(/(?:import|export)\s[^'"`;]*?from\s*["']([^"']+)["']|import\s*\(?\s*["']([^"']+)["']/g)) {
      refs.push(m[1] || m[2]);
    }
  } else if (file.endsWith(".html")) {
    for (const m of text.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) refs.push(m[1]);
  }
  return refs.filter((r) => !/^([a-z]+:|\/\/|#|data:)/i.test(r));
}

export function buildSite(outDir = path.join(ROOT, "site")) {
  const out = path.resolve(outDir);
  if (out === ROOT || ROOT.startsWith(out + path.sep)) throw new Error(`Refusing to use ${out} as the output folder.`);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const f of FILES) if (existsSync(path.join(ROOT, f))) cpSync(path.join(ROOT, f), path.join(out, f));
  for (const d of DIRS) if (existsSync(path.join(ROOT, d))) cpSync(path.join(ROOT, d), path.join(out, d), { recursive: true });
  if (!existsSync(path.join(out, "index.html"))) throw new Error("index.html is missing.");

  const problems = [];
  for (const file of walk(out).filter((f) => /\.(js|html)$/.test(f))) {
    for (const ref of relativeRefs(file)) {
      const target = path.resolve(path.dirname(file), ref.split(/[?#]/)[0]);
      const inside = target.startsWith(out + path.sep);
      if (!inside || !existsSync(target) || !statSync(target).isFile()) {
        problems.push(`${path.relative(out, file)} refers to "${ref}", which is not in the site folder.`);
      }
    }
  }
  if (problems.length) throw new Error("Build failed:\n" + problems.join("\n"));
  return walk(out).map((f) => path.relative(out, f).split(path.sep).join("/")).sort();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const files = buildSite(process.argv[2]);
    console.log(`Built site/ with ${files.length} files.`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
