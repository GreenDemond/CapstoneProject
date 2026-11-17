// Local server for `npm start`. Serves the app's own files only.
// Uses only Node's built-in modules, so it adds nothing to the shipped app.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const SERVED_FOLDERS = ["css", "js"];

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  let pathname;
  try {
    // A malformed %-escape (like %E0%A4%A) makes decoding throw, so answer 400 instead of crashing.
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad request");
    return;
  }
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);

  const fullPath = resolve(join(ROOT, normalize(relative)));
  // Check the final resolved path, so "..%2f" tricks cannot slip past the folder check.
  const allowed =
    fullPath === ROOT + "index.html" ||
    SERVED_FOLDERS.some((folder) => fullPath.startsWith(ROOT + folder + sep));
  // ROOT already ends with a slash, so a path inside it starts with ROOT.
  const insideRoot = fullPath.startsWith(ROOT) && !fullPath.split(sep).includes("..");

  if (!allowed || !insideRoot || !TYPES[extname(fullPath)]) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  try {
    const body = await readFile(fullPath);
    res.writeHead(200, {
      "Content-Type": TYPES[extname(fullPath)],
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Focus app running at http://localhost:${PORT}`);
});
