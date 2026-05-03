import { chromium } from "@playwright/test";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const root = process.cwd();
const port = 5188;
const mimeTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
};

const server = http.createServer((request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url ?? "/", `http://127.0.0.1:${port}`).pathname);
  const normalized = urlPath === "/" ? "/index.html" : urlPath;
  const target = path.normalize(path.join(root, normalized));

  if (!target.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[path.extname(target)] ?? "application/octet-stream",
  });
  fs.createReadStream(target).pipe(response);
});

await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

const browser = await chromium.launch();

try {
  const viewports = [
    { name: "desktop", width: 1440, height: 960 },
    { name: "mobile", width: 390, height: 844 },
  ];

  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
    await page.waitForSelector("canvas");
    await page.waitForTimeout(1200);

    for (const progress of [0, 0.52, 0.98]) {
      await page.evaluate((value) => {
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        window.scrollTo(0, maxScroll * value);
      }, progress);
      await page.waitForTimeout(900);

      const stats = await page.evaluate(() => {
        const canvas = document.querySelector("canvas");
        if (!(canvas instanceof HTMLCanvasElement)) {
          return { luma: 0, unique: 0 };
        }

        const sample = document.createElement("canvas");
        sample.width = 80;
        sample.height = 80;
        const context = sample.getContext("2d");
        if (!context) {
          return { luma: 0, unique: 0 };
        }

        context.drawImage(canvas, 0, 0, sample.width, sample.height);
        const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
        let luma = 0;
        const colors = new Set();

        for (let index = 0; index < pixels.length; index += 4) {
          const r = pixels[index];
          const g = pixels[index + 1];
          const b = pixels[index + 2];
          luma += (r + g + b) / 3;
          colors.add(`${r >> 4}-${g >> 4}-${b >> 4}`);
        }

        return {
          luma: luma / (pixels.length / 4),
          unique: colors.size,
        };
      });

      if (stats.luma < 4 || stats.unique < 10) {
        throw new Error(`${viewport.name} canvas looked blank at progress ${progress}: ${JSON.stringify(stats)}`);
      }
    }

    await page.screenshot({ path: `visual-check-${viewport.name}.png`, fullPage: false });
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
