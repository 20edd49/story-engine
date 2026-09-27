import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.ARCHIVE_URL || "http://localhost:3000";
await mkdir("test-results", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const queue = [
  "/",
  "/universes",
  "/search",
  "/reyes-bennett",
  "/elias-navarro",
];
const visited = new Set();
while (queue.length) {
  const path = queue.shift();
  if (visited.has(path)) continue;
  visited.add(path);
  const response = await page.goto(base + path);
  assert.ok(response.status() < 400, `${path}: ${response.status()}`);
  await page.locator("main").waitFor();
  assert.equal(await page.locator("h1").count(), 1, `${path}: one h1`);
  const links = await page
    .locator('a[href^="/"]')
    .evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute("href").split("#")[0]),
    );
  for (const link of links)
    if (!visited.has(link) && !queue.includes(link)) queue.push(link);
}
await page.goto(base);
await page.screenshot({
  path: "test-results/home-desktop.png",
  fullPage: true,
});
await page.keyboard.press("Control+k");
await page.locator("dialog[open]").waitFor();
await page.getByLabel("Search all archive records").fill("Mateo");
await page.keyboard.press("ArrowDown");
await page.keyboard.press("ArrowUp");
await page.keyboard.press("Enter");
await page.waitForURL("**/characters/mateo-reyes");
assert.equal(await page.locator("dialog[open]").count(), 0);
await page.goto(base + "/reyes-bennett/timeline");
await page
  .locator('select[name="continuity"]')
  .selectOption("c-reyes-starbucks");
await page.getByRole("button", { name: "Apply filters" }).click();
await page.waitForURL("**continuity=c-reyes-starbucks**");
assert.equal(await page.locator(".timeline-event").count(), 0);
assert.ok(
  await page.getByText("History is waiting to be recorded.").isVisible(),
);
await page.goto(base + "/reyes-bennett/timeline");
await page.locator(".timeline-event summary").first().click();
assert.ok(await page.locator(".timeline-event[open]").count());
await page.goto(base + "/reyes-bennett/characters");
await page.getByLabel("Search characters").fill("Amelia Bennett-Reyes");
await expect(page.locator(".character-card")).toHaveCount(1);
await page.goto(base + "/search?universe=u-elias");
await page.getByLabel("Search archive", { exact: true }).fill("Mateo");
await expect(page.locator(".search-results>a")).toHaveCount(0);
for (const path of [
  "/elias-navarro/vehicles",
  "/elias-navarro/characters/mateo-reyes",
  "/reyes-bennett/timeline?continuity=c-elias-main",
  "/missing-universe",
]) {
  const response = await page.goto(base + path);
  assert.equal(response.status(), 404, `${path} must return 404`);
}
await page.setViewportSize({ width: 390, height: 844 });
for (const path of visited) {
  await page.goto(base + path);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    `${path}: mobile overflow`,
  );
}
await page.goto(base);
await page.screenshot({ path: "test-results/home-mobile.png", fullPage: true });
await page.getByRole("button", { name: "Toggle navigation" }).click();
assert.ok(
  await page
    .getByRole("navigation", { name: "Mobile global navigation" })
    .isVisible(),
);
await page.goto(base + "/elias-navarro");
await page.screenshot({
  path: "test-results/elias-mobile.png",
  fullPage: true,
});
await page.goto(base + "/reyes-bennett/scenes/a-space-for-the-everyday");
await page.screenshot({
  path: "test-results/reader-mobile.png",
  fullPage: true,
});
assert.deepEqual(errors, []);
await writeFile(
  "test-results/routes.json",
  JSON.stringify([...visited], null, 2),
);
console.log(
  `PASS: ${visited.size} routes; desktop/mobile; continuity filtering; search; command keyboard; invalid records; no browser errors.`,
);
await browser.close();
