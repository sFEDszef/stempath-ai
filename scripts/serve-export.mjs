// Local preview only. GitHub Pages serves out/ directly; no Node backend is deployed.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const root = resolve("out");
const basePath = "/stempath-ai";
const port = Number(process.env.PORT || 3000);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".txt": "text/plain; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2" };

await stat(resolve(root, "index.html"));
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (pathname === "/" || pathname === basePath) {
      res.writeHead(302, { Location: `${basePath}/` }).end();
      return;
    }
    if (!pathname.startsWith(`${basePath}/`)) throw new Error("Not found");
    let file = resolve(root, pathname.slice(basePath.length + 1));
    if (file !== root && !file.startsWith(root + sep)) throw new Error("Not found");
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(await readFile(resolve(root, "404.html")).catch(() => "Not found"));
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Static preview: http://127.0.0.1:${port}${basePath}/`);
});
