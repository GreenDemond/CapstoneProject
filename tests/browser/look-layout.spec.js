import { test, expect } from "@playwright/test";
import { startWork } from "./helpers/work.js";
import { openScreen } from "./helpers/nav.js";

// Layout checks for the look (design/look.md). They compare boxes and computed styles, never pixels.

const INTERACTIVE = "button, a[href], input, select, textarea, summary, [role=button]";

// Boxes of the visible things you can press inside one screen.
async function boxes(page, selector) {
  return page.evaluate(
    ([root, interactive]) => {
      const out = [];
      for (const node of globalThis.document.querySelector(root).querySelectorAll(interactive)) {
        const r = node.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        out.push({ name: (node.textContent || node.id || node.tagName).trim().slice(0, 30), x: r.left, y: r.top, w: r.width, h: r.height });
      }
      return out;
    },
    [selector, INTERACTIVE],
  );
}

function overlaps(list) {
  const found = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      const across = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const down = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (across > 1 && down > 1) found.push(`${a.name} / ${b.name}`);
    }
  }
  return found;
}

// The isolated runner starts one test per browser by file and line, so each test has its own line.
async function checkWorkOverlap(page, width) {
  await page.setViewportSize({ width, height: 800 });
  await startWork(page);
  await expect(page.locator(".current-step")).toBeVisible();
  const list = await boxes(page, "#work-screen");
  expect(list.length).toBeGreaterThan(5);
  expect(overlaps(list)).toEqual([]);
}

test("nothing you press overlaps on the Work screen at 360 wide", async ({ page }) => {
  await checkWorkOverlap(page, 360);
});

test("nothing you press overlaps on the Work screen at 1280 wide", async ({ page }) => {
  await checkWorkOverlap(page, 1280);
});

test("the five answer buttons look identical and are easy to tap", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await startWork(page);
  const names = ["Done", "Still working", "Stuck", "Drifted", "Later"];
  const looks = [];
  for (const name of names) {
    const button = page.locator("#work-body .answers").getByRole("button", { name, exact: true });
    looks.push(
      await button.evaluate((node) => {
        const s = globalThis.getComputedStyle(node);
        return {
          background: s.backgroundColor,
          color: s.color,
          border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
          weight: s.fontWeight,
          size: s.fontSize,
          height: Math.round(node.getBoundingClientRect().height),
        };
      }),
    );
  }
  for (const look of looks) expect(look).toEqual(looks[0]);
  expect(looks[0].height).toBeGreaterThanOrEqual(44);
});

async function checkTabBar(page, screen, root) {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("/");
  if (screen) await openScreen(page, screen);
  await page.evaluate(() => globalThis.scrollTo(0, globalThis.document.body.scrollHeight));
  const list = await boxes(page, root);
  expect(list.length).toBeGreaterThan(0);
  const last = Math.max(...list.map((b) => b.y + b.h));
  const tabTop = await page.locator("#tabbar").evaluate((node) => node.getBoundingClientRect().top);
  expect(last).toBeLessThanOrEqual(tabTop + 1);
}

test("the tab bar does not cover the last control on Today at phone width", async ({ page }) => {
  await checkTabBar(page, null, "#paste-screen");
});

test("the tab bar does not cover the last control on Plan at phone width", async ({ page }) => {
  await checkTabBar(page, "My calendar", "#calendar-screen");
});

test("the tab bar does not cover the last control on Me at phone width", async ({ page }) => {
  await checkTabBar(page, "Me and my data", "#me-screen");
});

test("no sideways scrolling on Today, Work and Plan at 360 wide", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  const sideways = () => page.evaluate(() => globalThis.document.documentElement.scrollWidth - globalThis.document.documentElement.clientWidth);
  await page.goto("/");
  expect(await sideways()).toBeLessThanOrEqual(0);
  await startWork(page);
  expect(await sideways()).toBeLessThanOrEqual(0);
  await page.goto("/");
  await openScreen(page, "My calendar");
  expect(await sideways()).toBeLessThanOrEqual(0);
});

// Width and row of each answer button, for the grid tests below.
async function answerBoxes(page) {
  return page.locator("#work-body .answers button").evaluateAll((nodes) =>
    nodes.map((node) => {
      const r = node.getBoundingClientRect();
      return { name: node.textContent.trim(), x: r.left, y: r.top, w: r.width };
    }),
  );
}

test("on the last step the four answer buttons make a clean 2 by 2 at 360 wide", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.install();
  await startWork(page, "- Only one step");
  // Starter steps pad a short list, so mark steps done until the last one is showing.
  for (let i = 0; i < 4; i++) {
    await page.clock.runFor(450);
    await page.getByRole("button", { name: "Done", exact: true }).click();
  }
  await expect(page.getByRole("button", { name: "Later", exact: true })).toHaveCount(0);
  await expect(page.locator("#work-body .answers button")).toHaveCount(4);
  const list = await answerBoxes(page);
  expect(list.map((b) => b.name)).toEqual(["Done", "Still working", "Stuck", "Drifted"]);
  for (const b of list) expect(Math.abs(b.w - list[0].w)).toBeLessThan(1.5);
  expect(Math.abs(list[0].y - list[1].y)).toBeLessThan(1);
  expect(Math.abs(list[2].y - list[3].y)).toBeLessThan(1);
  expect(list[2].y).toBeGreaterThan(list[0].y);
});

test("with five answer buttons at 360 wide, Later is the same width as the others", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await startWork(page);
  const list = await answerBoxes(page);
  expect(list).toHaveLength(5);
  for (const b of list) expect(Math.abs(b.w - list[0].w)).toBeLessThan(1.5);
  expect(list[4].y).toBeGreaterThan(list[2].y);
});
