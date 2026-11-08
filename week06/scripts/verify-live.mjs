import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const root = fileURLToPath(new URL("..", import.meta.url));
const { createServer } = await import(
  pathToFileURL(join(root, "node_modules/vite/dist/node/index.js"))
);
const { chromium } = await import(
  pathToFileURL(join(root, "node_modules/@playwright/test/index.mjs"))
);
const server = await createServer({
  root,
  server: { host: "127.0.0.1", port: 4196, strictPort: true },
  logLevel: "error",
});
await server.listen();
const output = join(root, "screenshots");
mkdirSync(output, { recursive: true });
const requests = [],
  consoleErrors = [],
  checks = [];
let browser;
try {
  browser = await chromium.launch({
    channel: process.platform === "win32" ? "msedge" : undefined,
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1024 },
  });
  page.on("pageerror", (e) => consoleErrors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.hostname === "api.themoviedb.org")
      requests.push({
        method: response.request().method(),
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        status: response.status(),
      });
  });
  const count = (path) => requests.filter((r) => r.path === path).length;
  async function snapshot() {
    return page.evaluate(async () => {
      const modulePath = "/src/config/query-client.ts";
      const { queryClient } = await import(modulePath);
      return queryClient
        .getQueryCache()
        .getAll()
        .map((query) => ({
          key: query.queryKey,
          status: query.state.status,
          fetchStatus: query.state.fetchStatus,
          stale: query.isStale(),
          observers: query.getObserversCount(),
          staleTime: query.options.staleTime,
          gcTime: query.gcTime,
        }));
    });
  }
  async function capture(name, fullPage = false) {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(
      () => Array.from(document.images).every((i) => i.complete),
      undefined,
      { timeout: 25000 },
    );
    await page.screenshot({
      path: join(output, name),
      fullPage,
      animations: "disabled",
    });
  }
  const popularResponse = page.waitForResponse(
    (r) => r.url().includes("/3/movie/popular") && r.status() === 200,
  );
  await page.goto("http://127.0.0.1:4196");
  const popular = await (await popularResponse).json();
  const selected =
    popular.results.find((m) => m.poster_path && m.backdrop_path) ||
    popular.results[0];
  await page
    .getByRole("heading", { name: selected.title, exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: selected.title + " 북마크 추가", exact: true })
    .click();
  await capture("01-live-list.png", true);
  const page2 = page.waitForResponse(
    (r) =>
      r.url().includes("/3/movie/popular") &&
      new URL(r.url()).searchParams.get("page") === "2" &&
      r.status() === 200,
  );
  await page.getByRole("button", { name: "2페이지", exact: true }).click();
  await page2;
  const beforeListReturn = count("/3/movie/popular");
  await page.getByRole("button", { name: "1페이지", exact: true }).click();
  await page
    .getByRole("heading", { name: selected.title, exact: true })
    .waitFor();
  assert.equal(count("/3/movie/popular"), beforeListReturn);
  checks.push({
    check: "list 1→2→1 cache reuse",
    countOnPage1: popular.results.length,
    successfulRequests: beforeListReturn,
    additionalRequestsOnReturn: 0,
    cache: await snapshot(),
  });
  await page
    .getByRole("button", { name: /Open Tanstack query devtools/i })
    .click();
  await page.getByRole("button", { name: /movies.*list.*page.*1/ }).waitFor();
  await page.getByRole("button", { name: /movies.*list.*page.*2/ }).waitFor();
  await capture("02-devtools-list-cache.png");
  await page
    .getByRole("button", { name: "Close tanstack query devtools", exact: true })
    .click();

  await page
    .locator("header nav")
    .getByRole("link", { name: "검색", exact: true })
    .click();
  await page.getByText("검색어를 입력해 주세요.").waitFor();
  assert.equal(count("/3/search/movie"), 0);
  checks.push({
    check: "empty search does not fetch",
    cache: await snapshot(),
  });
  const searchResponse = page.waitForResponse(
    (r) => r.url().includes("/3/search/movie") && r.status() === 200,
  );
  await page.getByRole("textbox", { name: "검색어" }).fill("스파이더맨");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  const search = await (await searchResponse).json();
  await page
    .getByText("영화 " + search.total_results + "편", { exact: true })
    .waitFor();
  await capture("03-live-search.png");
  const beforeSearchReturn = count("/3/search/movie");
  await page
    .locator("header nav")
    .getByRole("link", { name: "영화", exact: true })
    .click();
  await page.goBack();
  await page
    .getByText("영화 " + search.total_results + "편", { exact: true })
    .waitFor();
  assert.equal(count("/3/search/movie"), beforeSearchReturn);
  checks.push({
    check: "search cache reuse",
    query: "스파이더맨",
    totalResults: search.total_results,
    additionalRequestsOnReturn: 0,
    cache: await snapshot(),
  });

  await page
    .locator("header nav")
    .getByRole("link", { name: "영화", exact: true })
    .click();
  const detailResponse = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/3/movie/" + selected.id &&
      r.status() === 200,
  );
  await page
    .getByRole("heading", { name: selected.title, exact: true })
    .getByRole("link")
    .click();
  const detail = await (await detailResponse).json();
  await page
    .getByRole("button", { name: selected.title + " 북마크 해제", exact: true })
    .waitFor();
  await capture("04-live-detail.png");
  const beforeDetailReturn = count("/3/movie/" + selected.id);
  await page.getByRole("link", { name: "영화 목록", exact: true }).click();
  await page
    .getByRole("heading", { name: selected.title, exact: true })
    .getByRole("link")
    .click();
  await page
    .getByRole("heading", { name: selected.title, exact: true })
    .waitFor();
  assert.equal(count("/3/movie/" + selected.id), beforeDetailReturn);
  checks.push({
    check: "detail cache reuse",
    id: detail.id,
    title: detail.title,
    additionalRequestsOnReturn: 0,
  });
  await page
    .getByRole("button", { name: /Open Tanstack query devtools/i })
    .click();
  await page
    .getByRole("button", { name: new RegExp("movies.*detail.*" + detail.id) })
    .click();
  const fresh = (await snapshot()).find((q) => q.key[1] === "detail");
  assert.equal(fresh.stale, false);
  await capture("05-devtools-detail-fresh.png");
  console.log(
    "Real API and cache reuse verified; checking the 30-second detail staleTime.",
  );
  await page.waitForTimeout(30_100);
  const stale = (await snapshot()).find((q) => q.key[1] === "detail");
  assert.equal(stale.stale, true);
  assert.equal(count("/3/movie/" + selected.id), beforeDetailReturn);
  await capture("06-devtools-detail-stale.png");
  checks.push({
    check: "detail fresh→stale after 30 seconds",
    fresh,
    stale,
    requestsTriggeredByTimeAlone: 0,
  });
  await page
    .getByRole("button", { name: "Close tanstack query devtools", exact: true })
    .click();
  await page.getByRole("link", { name: "영화 목록", exact: true }).click();
  const refetch = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/3/movie/" + selected.id &&
      r.status() === 200,
  );
  await page
    .getByRole("heading", { name: selected.title, exact: true })
    .getByRole("link")
    .click();
  await refetch;
  checks.push({
    check: "stale detail refetch on remount",
    additionalRequests: count("/3/movie/" + selected.id) - beforeDetailReturn,
  });
  const responsive = [];
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    responsive.push({ width, horizontalOverflow: false });
  }
  assert.deepEqual(consoleErrors, []);
  const result = {
    source: "real TMDB API without request interception",
    checkedAt: new Date().toISOString(),
    checks,
    requests,
    responsive,
    consoleErrors,
  };
  writeFileSync(
    join(output, "verification.json"),
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(
    JSON.stringify(
      {
        checks: checks.map((c) => c.check),
        successfulApiResponses: requests.length,
        consoleErrors,
      },
      null,
      2,
    ),
  );
} finally {
  if (browser) await browser.close();
  await server.close();
}
