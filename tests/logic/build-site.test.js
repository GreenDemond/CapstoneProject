import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildSite } from "../../scripts/build-site.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const f = path.join(dir, n);
  return statSync(f).isDirectory() ? walk(f).map((x) => `${n}/${x}`) : [n];
});

test("site folder holds only index.html, css and js", () => {
  const tmp = mkdtempSync(path.join(tmpdir(), "site-"));
  try {
    const out = path.join(tmp, "site");
    const files = buildSite(out);
    const expected = [
      "index.html",
      ...walk(path.join(ROOT, "css")).map((f) => `css/${f}`),
      ...walk(path.join(ROOT, "js")).map((f) => `js/${f}`),
    ].sort();
    assert.deepEqual(files, expected);
    assert.deepEqual(walk(out).sort(), expected);
    for (const f of files) {
      assert.ok(/^(index\.html|css\/|js\/)/.test(f), f);
      assert.ok(!/(^|\/)\./.test(f), `dotfile: ${f}`);
      assert.ok(!/(^|\/)(\.git|server|node_modules|ios|design|tests)\//.test(f), f);
      assert.ok(!/package(-lock)?\.json$|\.config\.js$|dev-server\.mjs$|\.md$/.test(f), f);
    }
    assert.ok(readFileSync(path.join(out, "index.html"), "utf8").includes("js/app.js"));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("build refuses to use the project folder as output", () => {
  assert.throws(() => buildSite(ROOT), /Refusing/);
});
