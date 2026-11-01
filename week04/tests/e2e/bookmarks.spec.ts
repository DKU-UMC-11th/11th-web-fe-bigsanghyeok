import { test, expect, chromium, type Page } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

const KEY = "umcine-bookmark-store";
const TITLE = "스파이더맨: 브랜드 뉴 데이";
const SECOND = "스파이더맨: 노 웨이 홈";
const bookmark = (page: Page, title: string, active: boolean) =>
  page.getByRole("button", {
    name: title + (active ? " 북마크 해제" : " 북마크 추가"),
    exact: true,
  });
const savedIds = (page: Page) =>
  page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key) ?? "null")?.state
        .bookmarkedMovieIds ?? [],
    KEY,
  );
const runtimeErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  runtimeErrors.length = 0;
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
});
test.afterEach(() => {
  expect(runtimeErrors).toEqual([]);
});

test("목록 → 검색 → 상세에서 추가와 제거를 공유하고 북마크 클릭은 이동하지 않는다", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("article")).toHaveCount(10);
  await expect(page.locator("article [aria-pressed=true]")).toHaveCount(0);
  await bookmark(page, TITLE, false).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(bookmark(page, TITLE, true)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(bookmark(page, "오디세이", false)).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page
    .locator("header nav")
    .getByRole("link", { name: "검색", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "검색어", exact: true })
    .fill("스파이더맨");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("영화 2편");
  await expect(bookmark(page, TITLE, true)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await bookmark(page, SECOND, false).focus();
  await page.keyboard.press("Space");
  await expect.poll(() => savedIds(page)).toEqual([1, 3]);
  await page.getByRole("link", { name: TITLE, exact: true }).click();
  await expect(page).toHaveURL(/\/movies\/1$/);
  await expect(bookmark(page, TITLE, true)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await bookmark(page, TITLE, true).click();
  await expect(bookmark(page, TITLE, false)).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page
    .locator("header nav")
    .getByRole("link", { name: "검색", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "검색어", exact: true })
    .fill("스파이더맨");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(bookmark(page, TITLE, false)).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(bookmark(page, SECOND, true)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .locator("header nav")
    .getByRole("link", { name: "영화", exact: true })
    .click();
  await expect(bookmark(page, TITLE, false)).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(bookmark(page, SECOND, true)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("ID 배열만 저장하고 새로고침, key 삭제 후 빈 상태 복원을 확인한다", async ({
  page,
}) => {
  await page.goto("/");
  await bookmark(page, TITLE, false).click();
  await bookmark(page, "토이 스토리 5", false).click();
  await expect.poll(() => savedIds(page)).toEqual([1, 7]);
  const stored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    KEY,
  );
  expect(stored).toEqual({ state: { bookmarkedMovieIds: [1, 7] }, version: 0 });
  await page.reload();
  await expect(bookmark(page, TITLE, true)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(bookmark(page, "토이 스토리 5", true)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.evaluate((key) => {
    localStorage.setItem("unrelated-setting", "keep");
    localStorage.removeItem(key);
  }, KEY);
  await page.reload();
  await expect(page.locator("article [aria-pressed=true]")).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("unrelated-setting")),
  ).toBe("keep");
});

test("브라우저 프로세스를 종료하고 같은 프로필로 다시 열어도 북마크가 유지된다", async ({
  baseURL,
}) => {
  const profile = await mkdtemp(join(tmpdir(), "umcine-week04-profile-"));
  if (!resolve(profile).startsWith(resolve(tmpdir()) + sep))
    throw new Error("Unexpected browser profile path");
  const options = {
    channel: process.platform === "win32" ? "msedge" : undefined,
    headless: true,
  };
  let context = await chromium.launchPersistentContext(profile, options);
  try {
    let page = await context.newPage();
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    await page.goto(baseURL!);
    await bookmark(page, TITLE, false).click();
    await bookmark(page, "오디세이", false).click();
    await expect.poll(() => savedIds(page)).toEqual([1, 2]);
    await context.close();
    context = await chromium.launchPersistentContext(profile, options);
    page = await context.newPage();
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    await page.goto(baseURL! + "/movies/1");
    await expect(bookmark(page, TITLE, true)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByRole("link", { name: "영화 목록", exact: true }).click();
    await expect(bookmark(page, "오디세이", true)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect.poll(() => savedIds(page)).toEqual([1, 2]);
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

for (const [label, value] of [
  ["잘못된 JSON", "broken-json"],
  ["null", "null"],
  [
    "배열이 아닌 ID",
    JSON.stringify({ state: { bookmarkedMovieIds: "bad" }, version: 0 }),
  ],
  [
    "지원하지 않는 version",
    JSON.stringify({ state: { bookmarkedMovieIds: [1] }, version: 999 }),
  ],
] as const) {
  test(
    label + "에서는 빈 상태로 시작하고 다시 저장할 수 있다",
    async ({ page }) => {
      await page.addInitScript(
        ({ key, value }) => {
          localStorage.setItem(key, value);
        },
        { key: KEY, value },
      );
      await page.goto("/");
      await expect(page.locator("article [aria-pressed=true]")).toHaveCount(0);
      await bookmark(page, TITLE, false).click();
      await expect.poll(() => savedIds(page)).toEqual([1]);
    },
  );
}

test("복원할 때 잘못된 ID·중복·저장된 가짜 action을 제외한다", async ({
  page,
}) => {
  await page.addInitScript(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          state: {
            bookmarkedMovieIds: [1, "2", 2, -1, 0, 1.5, null, 1, 2],
            toggleBookmark: "bad",
          },
          version: 0,
        }),
      ),
    KEY,
  );
  await page.goto("/");
  await expect(bookmark(page, TITLE, true)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(bookmark(page, "오디세이", true)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await bookmark(page, TITLE, true).click();
  await expect.poll(() => savedIds(page)).toEqual([2]);
});

test("저장소 사용이 차단되어도 현재 탭에서 화면 간 북마크를 공유한다", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    }),
  );
  await page.goto("/");
  await bookmark(page, TITLE, false).click();
  await page.getByRole("link", { name: TITLE, exact: true }).click();
  await expect(bookmark(page, TITLE, true)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await bookmark(page, TITLE, true).click();
  await page.getByRole("link", { name: "영화 목록", exact: true }).click();
  await expect(bookmark(page, TITLE, false)).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("평점은 북마크 저장값과 분리되고 기존 검색·상세 안내도 유지된다", async ({
  page,
}) => {
  await page.goto("/movies/1");
  await page.getByRole("button", { name: "4점", exact: true }).click();
  await page
    .getByRole("textbox", { name: "후기", exact: true })
    .fill("스토어 전환 후에도 평점은 유지돼요.");
  await page.getByRole("button", { name: "평점 저장", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("평점을 저장했어요.");
  await bookmark(page, TITLE, false).click();
  await expect.poll(() => savedIds(page)).toEqual([1]);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "4점", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.getByRole("textbox", { name: "후기", exact: true }).inputValue(),
  ).toBe("스토어 전환 후에도 평점은 유지돼요.");
  await page.goto("/movies/999");
  await expect(
    page.getByText("영화를 찾을 수 없어요.", { exact: true }),
  ).toBeVisible();
  await page.goto("/search?query=no-such-movie-xyz");
  await expect(
    page.getByText("검색 결과가 없어요.", { exact: true }),
  ).toBeVisible();
  await page.goto("/search");
  await expect(
    page.getByText("검색어를 입력해 주세요.", { exact: true }),
  ).toBeVisible();
});
