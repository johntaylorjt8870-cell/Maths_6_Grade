/**
 * خادم محلي للنسخة المصدَّرة (out/) يحاكي GitHub Pages:
 * الموقع يُقدَّم تحت مسار فرعي /Maths_6_Grade/ كما في النشر الفعلي.
 *
 * الاستخدام: npm run build && npm run preview
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? "0.0.0.0";
const ROOT = resolve(process.cwd(), "out");
const BASE = "/Maths_6_Grade";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

if (!existsSync(ROOT)) {
  console.error("مجلد out غير موجود. شغّل `npm run build` أولًا.");
  process.exit(1);
}

function send(res, status, file) {
  res.writeHead(status, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0]);

  // الصفحة الجذرية للمنصة تُحوَّل إلى المسار الفرعي.
  if (url === "/" || url === "") {
    res.writeHead(302, { Location: `${BASE}/` });
    res.end();
    return;
  }

  if (!url.startsWith(BASE)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 — خارج مسار المنصة");
    return;
  }

  const relative = url.slice(BASE.length) || "/";
  const safe = normalize(relative).replace(/^(\.\.[/\\])+/, "");
  let target = join(ROOT, safe);

  if (existsSync(target) && statSync(target).isDirectory()) {
    target = join(target, "index.html");
  } else if (!existsSync(target) && existsSync(`${target}.html`)) {
    target = `${target}.html`;
  }

  if (!existsSync(target)) {
    const notFound = join(ROOT, "404.html");
    if (existsSync(notFound)) {
      send(res, 404, notFound);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404");
    }
    return;
  }

  send(res, 200, target);
}).listen(PORT, HOST, () => {
  console.log(`النسخة الثابتة تعمل على http://localhost:${PORT}${BASE}/`);
});
