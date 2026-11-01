import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const { createServer } = await import(
  pathToFileURL(join(root, "node_modules/vite/dist/node/index.js"))
);
const { chromium } = await import(
  pathToFileURL(join(root, "node_modules/@playwright/test/index.mjs"))
);
const server = await createServer({
  root,
  server: { host: "127.0.0.1", port: 4176, strictPort: true },
  logLevel: "error",
});
await server.listen();
const output = join(root, "screenshots");
mkdirSync(output, { recursive: true });
const errors = [];
const requests = [];
const checks = [];
let browser;
try {
  const url = "http://127.0.0.1:4176";
  browser = await chromium.launch({
    channel: process.platform === "win32" ? "msedge" : undefined,
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1024 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("response", (res) => {
    const u = new URL(res.url());
    if (u.hostname === "api.themoviedb.org")
      requests.push({
        method: res.request().method(),
        path: u.pathname,
        query: Object.fromEntries(u.searchParams),
        status: res.status(),
      });
  });
  async function capture(name, fullPage = true) {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(
      () => Array.from(document.images).every((i) => i.complete),
      undefined,
      { timeout: 20000 },
    );
    await page.screenshot({
      path: join(output, name),
      fullPage,
      animations: "disabled",
    });
  }
  const popularPromise = page.waitForResponse(
    (r) => r.url().includes("/3/movie/popular") && r.status() === 200,
    { timeout: 30000 },
  );
  await page.goto(url);
  const popular = await (await popularPromise).json();
  if (!popular.results.length) throw new Error("Live popular results empty");
  await page
    .getByRole("heading", { name: popular.results[0].title, exact: true })
    .waitFor();
  checks.push({
    check: "ky popular",
    page: popular.page,
    count: popular.results.length,
    totalResults: popular.total_results,
    firstId: popular.results[0].id,
  });
  const fetchResponse = page.waitForResponse(
    (r) => r.url().includes("/3/movie/popular") && r.status() === 200,
  );
  const fetchResult = await page.evaluate(async () => {
    const modulePath = "/src/api/movies/get-movies-with-fetch.ts";
    const { getMoviesWithFetch } = await import(modulePath);
    const data = await getMoviesWithFetch();
    return {
      page: data.page,
      count: data.results.length,
      totalResults: data.total_results,
      firstId: data.results[0]?.id,
    };
  });
  await fetchResponse;
  checks.push({ check: "pure fetch", ...fetchResult });
  const selected =
    popular.results.find((m) => m.poster_path && m.backdrop_path) ||
    popular.results[0];
  await page
    .getByRole("button", { name: selected.title + " 북마크 추가", exact: true })
    .click();
  await capture("01-live-list.png");
  await page.reload();
  await page
    .getByRole("button", { name: selected.title + " 북마크 해제", exact: true })
    .waitFor();
  checks.push({ check: "list direct URL and reload", passed: true });
  const searchPromise = page.waitForResponse(
    (r) => r.url().includes("/3/search/movie") && r.status() === 200,
  );
  await page.goto(url + "/search?query=" + encodeURIComponent("스파이더맨"));
  const search = await (await searchPromise).json();
  await page
    .getByRole("heading", { name: "‘스파이더맨’ 검색 결과", exact: true })
    .waitFor();
  await page
    .getByText("영화 " + search.total_results + "편", { exact: true })
    .waitFor();
  await capture("02-live-search.png", false);
  checks.push({
    check: "search direct URL",
    query: "스파이더맨",
    count: search.results.length,
    totalResults: search.total_results,
  });
  await page.reload();
  await page
    .getByText("영화 " + search.total_results + "편", { exact: true })
    .waitFor();
  checks.push({ check: "search reload", passed: true });
  const detailPromise = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/3/movie/" + selected.id &&
      r.status() === 200,
  );
  await page.goto(url + "/movies/" + selected.id);
  const detail = await (await detailPromise).json();
  await page
    .getByRole("heading", { name: detail.title, exact: true })
    .first()
    .waitFor();
  await page
    .getByRole("button", { name: detail.title + " 북마크 해제", exact: true })
    .waitFor();
  await capture("03-live-detail.png");
  await page.reload();
  await page
    .getByRole("heading", { name: detail.title, exact: true })
    .first()
    .waitFor();
  checks.push({
    check: "detail direct URL and reload",
    id: detail.id,
    title: detail.title,
    originalTitle: detail.original_title,
    runtime: detail.runtime,
    genres: detail.genres.map((g) => g.name),
  });
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("umcine-bookmark-store")),
  );
  if (!saved.state.bookmarkedMovieIds.includes(selected.id))
    throw new Error("Live bookmark restoration failed");
  checks.push({
    check: "bookmark persisted TMDB ID",
    passed: true,
    id: selected.id,
  });
  const responsive = [];
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of [
      "/",
      "/search?query=" + encodeURIComponent("스파이더맨"),
      "/movies/" + selected.id,
    ]) {
      await page.goto(url + route);
      await page.waitForSelector(
        route.startsWith("/movies")
          ? "main section"
          : route.startsWith("/search")
            ? "section ul"
            : "main ul",
      );
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        )
      )
        throw new Error("Overflow " + width + " " + route);
      responsive.push({ width, route, overflow: false });
      if (width === 390 && route.startsWith("/search"))
        await capture("04-live-mobile-search.png", false);
    }
  }
  if (errors.length) throw new Error("Browser Console: " + errors.join("\n"));
  const result = {
    source: "real TMDB API; no route interception or mock data",
    checkedAt: new Date().toISOString(),
    checks,
    requests,
    responsive,
    consoleErrors: errors,
  };
  writeFileSync(
    join(output, "verification.json"),
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  if (browser) await browser.close();
  await server.close();
}
