"use strict";
/* Tiny zero-dependency static server so the site runs anywhere that runs Node
   (Railway, Render, Fly, a VPS). Vercel/Netlify ignore this file and serve statically.
   Mirrors vercel.json: clean URLs, security headers, 404 page. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};
const COMPRESSIBLE = new Set([".html", ".css", ".js", ".svg", ".txt", ".xml"]);

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

// Only these are ever served; server.js, package.json, README.md etc. stay private.
const PUBLIC_DIRS = ["css", "js", "assets"];
const PUBLIC_ROOT_FILES = new Set(["robots.txt", "sitemap.xml"]);

function resolveFile(pathname) {
  let p;
  try { p = decodeURIComponent(pathname); } catch { return null; }
  if (p.includes("\0")) return null;
  if (p === "/" || p === "") return path.join(ROOT, "index.html");
  const clean = p.replace(/\/+$/, "");
  const first = clean.split("/")[1];
  let candidate = null;
  if (PUBLIC_DIRS.includes(first)) candidate = path.join(ROOT, clean);
  else if (PUBLIC_ROOT_FILES.has(clean.slice(1))) candidate = path.join(ROOT, clean);
  else if (/^\/[a-z0-9-]+$/i.test(clean)) candidate = path.join(ROOT, clean + ".html"); // clean URLs
  if (!candidate) return null;
  const normalized = path.normalize(candidate);
  if (!normalized.startsWith(ROOT + path.sep)) return null; // no path traversal
  return normalized;
}

function cacheControl(ext) {
  if (ext === ".html") return "no-cache";
  if (ext === ".css" || ext === ".js") return "public, max-age=3600";
  return "public, max-age=86400";
}

function send(req, res, status, file, extraHeaders) {
  const ext = path.extname(file).toLowerCase();
  let body;
  try { body = fs.readFileSync(file); } catch { res.writeHead(500); return res.end("Server error"); }
  if (ext === ".html") {
    // Social crawlers (WhatsApp, Facebook, X) need an absolute og:image URL; build it from the request.
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "");
    if (/^[a-z0-9.-]+(:\d+)?$/i.test(host)) {
      const proto = req.headers["x-forwarded-proto"] === "http" || /^localhost/.test(host) ? "http" : "https";
      body = Buffer.from(body.toString("utf8").replace(/content="\/assets\/og\.png"/g, `content="${proto}://${host}/assets/og.png"`));
    }
  }
  const headers = Object.assign(
    { "Content-Type": TYPES[ext] || "application/octet-stream", "Cache-Control": cacheControl(ext), Vary: "Accept-Encoding" },
    SECURITY_HEADERS,
    extraHeaders
  );
  if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers["accept-encoding"] || "") && body.length > 512) {
    body = zlib.gzipSync(body);
    headers["Content-Encoding"] = "gzip";
  }
  headers["Content-Length"] = body.length;
  res.writeHead(status, headers);
  res.end(req.method === "HEAD" ? undefined : body);
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD", ...SECURITY_HEADERS });
    return res.end("Method not allowed");
  }
  const url = new URL(req.url, "http://localhost");

  // /schools.html -> /schools (matches Vercel cleanUrls)
  if (/^\/[a-z0-9-]+\.html$/i.test(url.pathname)) {
    const target = url.pathname.replace(/\.html$/i, "").replace(/^\/index$/, "/");
    res.writeHead(308, { Location: target + url.search, ...SECURITY_HEADERS });
    return res.end();
  }

  const file = resolveFile(url.pathname);
  if (file && fs.existsSync(file) && fs.statSync(file).isFile()) return send(req, res, 200, file);
  return send(req, res, 404, path.join(ROOT, "404.html"));
});

server.listen(PORT, "0.0.0.0", () => console.log(`Side Quests listening on ${PORT}`));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
