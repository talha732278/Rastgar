// Usage: node render.mjs <bundle.js> <shots.json> <outdir>
// Renders each shot in headless Chromium (SwiftShader WebGL) and writes PNGs.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? "playwright");

const [bundle, shotsFile, outDir] = process.argv.slice(2);
const shots = JSON.parse(readFileSync(shotsFile, "utf8"));
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
page.on("console", (m) => console.log("[page]", m.text()));
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.setContent("<!doctype html><html><body></body></html>");
await page.addScriptTag({ content: readFileSync(bundle, "utf8"), type: "module" });
await page.waitForFunction(() => typeof window.renderShot === "function");

for (const shot of shots) {
  const t0 = Date.now();
  const dataUrl = await page.evaluate((req) => window.renderShot(req), shot);
  writeFileSync(join(outDir, `${shot.name}.png`), Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log(`rendered ${shot.name} ${shot.width}x${shot.height} in ${Date.now() - t0}ms`);
}
await browser.close();
