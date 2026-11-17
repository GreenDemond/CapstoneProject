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
  const pathname = decodeURIComponent(url.pathname);
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);

  // Only the page itself and the css and js folders are served.
  const allowed =
    relative === "index.html" ||
    SERVED_FOLDERS.some((folder) => relative.startsWith(`${folder}/`));
  const fullPath = resolve(join(ROOT, normalize(relative)));
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
