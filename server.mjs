import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import http from "node:http";

const port = Number(process.env.PORT || 4173);
const distDir = join(process.cwd(), "dist");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function sendFile(res, filePath) {
  const type = contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const urlPath = req.url === "/" ? "/index.html" : req.url || "/index.html";
  const sanitizedPath = normalize(urlPath).replace(/^(\.\.[\\/])+/, "");
  const candidate = join(distDir, sanitizedPath);

  if (existsSync(candidate) && statSync(candidate).isFile()) {
    sendFile(res, candidate);
    return;
  }

  const indexPath = join(distDir, "index.html");

  if (existsSync(indexPath)) {
    sendFile(res, indexPath);
    return;
  }

  res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Build output not found. Run `npm run build` before starting the server.");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Static server listening on ${port}`);
});
