import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { timeline } from "../src/registry.mjs";

test("the static build has navigable published routes and all local assets", async () => {
  const root = new URL("../", import.meta.url);
  execFileSync(process.execPath, ["scripts/build.mjs"], { cwd: fileURLToPath(root) });
  const dist = new URL("dist/", root);
  const published = timeline.filter(({ status }) => status === "published");
  const routes = await readdir(new URL("experiments/", dist));
  assert.deepEqual(routes.sort(), published.map(({ slug }) => slug).sort());

  const pages = [
    new URL("index.html", dist),
    ...published.map(({ slug }) => new URL(`experiments/${slug}/index.html`, dist)),
  ];
  for (const page of pages) {
    const html = await readFile(page, "utf8");
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
    const localLinks = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(([, href]) => href)
      .filter((href) => /^(?:\.\/|\.\.\/)/.test(href));
    for (const href of new Set(localLinks)) {
      const target = new URL(href, page);
      const entry = await stat(target);
      if (entry.isDirectory()) await stat(new URL("index.html", target));
    }
  }
  const home = await readFile(pages[0], "utf8");
  assert.equal((home.match(/class="experiment-card"/g) ?? []).length, timeline.length);
  assert.doesNotMatch(home, /href="\.\/experiments\/eratosthenes\//);
  assert.match(await readFile(pages[1], "utf8"), /id="virtual-lab"/);
});
