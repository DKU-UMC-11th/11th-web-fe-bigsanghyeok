import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
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
  server: { host: "localhost", port: 5173, strictPort: true },
  logLevel: "error",
});
await server.listen();
const output = join(root, "screenshots");
mkdirSync(output, { recursive: true });
let browser;
const requests = [],
  dialogs = [],
  errors = [],
  checks = [];
try {
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
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.accept();
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.hostname === "localhost" && url.port === "8080")
      requests.push({
        method: response.request().method(),
        path: url.pathname,
        status: response.status(),
      });
  });
  async function capture(name) {
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur();
    });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    if (name === "04-edit-profile.png")
      await page.waitForFunction(
        () =>
          document.querySelector("main section").getBoundingClientRect()
            .bottom >=
          innerHeight - 80,
      );
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      return document.fonts.ready;
    });
    await page.waitForFunction(
      () => Array.from(document.images).every((i) => i.complete),
      undefined,
      { timeout: 20000 },
    );
    await page.screenshot({
      path: join(output, name),
      fullPage: true,
      animations: "disabled",
    });
  }
  const base = "http://localhost:5173";
  await page.goto(base + "/login");
  await page.getByLabel("이메일", { exact: true }).fill("name@example.com");
  await page.getByLabel("비밀번호", { exact: true }).fill("Movie123!");
  await capture("01-login.png");
  checks.push({
    check: "login inputs",
    emailVisible: true,
    passwordMasked:
      (await page
        .getByLabel("비밀번호", { exact: true })
        .getAttribute("type")) === "password",
    backendLoginConnected: false,
  });

  await page.getByRole("link", { name: "회원가입", exact: true }).click();
  await page.getByRole("heading", { name: "회원가입", exact: true }).waitFor();
  const suffix = String(Date.now()).slice(-7);
  const email = "week07-" + suffix + "@example.com",
    nickname = "회원" + suffix;
  await page.getByLabel("이메일", { exact: true }).fill(email);
  await page.getByLabel("닉네임", { exact: true }).fill(nickname);
  await page.getByLabel("비밀번호", { exact: true }).fill("Movie123!");
  await page.getByLabel("비밀번호 확인", { exact: true }).fill("Movie123!");
  for (const field of ["이메일", "닉네임"]) {
    const endpoint =
      field === "이메일" ? "/members/email/" : "/members/nickname/";
    const response = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname.startsWith(endpoint) && r.status() === 200,
    );
    await page
      .getByRole("button", { name: field + " 중복 확인", exact: true })
      .click();
    assert.equal((await (await response).json()).available, true);
  }
  await page.getByRole("button", { name: "가입하기", exact: true }).waitFor();
  await capture("02-signup.png");
  const createdResponse = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/members" &&
      r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "가입하기", exact: true }).click();
  const created = await createdResponse;
  assert.equal(created.status(), 201);
  const requestBody = created.request().postDataJSON();
  assert.deepEqual(Object.keys(requestBody).sort(), [
    "email",
    "nickname",
    "password",
  ]);
  assert.equal(created.request().headers()["authorization"], undefined);
  const body = await created.json();
  assert.equal(body.isSuccess, true);
  assert.equal(body.result.email, email);
  await page.getByRole("button", { name: "가입하기", exact: true }).waitFor();
  checks.push({
    check: "signup against actual Spring/MySQL",
    status: created.status(),
    isSuccess: body.isSuccess,
    requestFields: Object.keys(requestBody),
    passwordInResponse: Object.hasOwn(body.result, "password"),
    memberId: body.result.memberId,
  });
  const duplicate = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname.startsWith("/members/email/") &&
      r.status() === 200,
  );
  await page
    .getByRole("button", { name: "이메일 중복 확인", exact: true })
    .click();
  assert.equal((await (await duplicate).json()).available, false);
  checks.push({ check: "created email becomes unavailable", available: false });

  const popularResponse = page.waitForResponse(
    (r) =>
      r.url().includes("api.themoviedb.org/3/movie/popular") &&
      r.status() === 200,
  );
  await page.goto(base + "/");
  const movies = (await (await popularResponse).json()).results.slice(0, 3);
  for (const movie of movies)
    await page
      .getByRole("button", { name: movie.title + " 북마크 추가", exact: true })
      .click();
  await page
    .locator("header nav")
    .getByRole("link", { name: "내 정보", exact: true })
    .click();
  for (const movie of movies)
    await page
      .getByRole("heading", { name: movie.title, exact: true })
      .waitFor();
  await capture("03-my.png");
  checks.push({
    check: "my profile publishing and existing favorites",
    nickname: "gs0428",
    favoriteIds: movies.map((m) => m.id),
    profileApiConnected: false,
  });
  await page.getByRole("link", { name: "정보 수정", exact: true }).click();
  await page
    .getByRole("heading", { name: "내 정보 수정", exact: true })
    .waitFor();
  await capture("04-edit-profile.png");
  await page.getByLabel("닉네임", { exact: true }).fill("대상혁07");
  const availableNickname = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname.startsWith("/members/nickname/") &&
      r.status() === 200,
  );
  await page.getByRole("button", { name: "중복 확인", exact: true }).click();
  assert.equal((await (await availableNickname).json()).available, true);
  await page
    .getByRole("button", { name: "변경사항 저장", exact: true })
    .click();
  await page.getByText("대상혁07", { exact: true }).waitFor();
  await capture("05-my-updated.png");
  checks.push({
    check: "local profile nickname update",
    savedNickname: "대상혁07",
    emailUnchanged: true,
    updateApiConnected: false,
  });

  const responsive = [];
  for (const route of ["/login", "/signup", "/my", "/my/edit"]) {
    await page.goto(base + route);
    await page.locator("main h1").waitFor();
    await page.reload();
    await page.locator("main h1").waitFor();
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1024 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      responsive.push({ route, width, horizontalOverflow: false });
      if (route === "/my/edit" && width === 390)
        await capture("06-mobile-edit.png");
    }
  }
  assert.deepEqual(errors, []);
  const result = {
    checkedAt: new Date().toISOString(),
    source:
      "Actual Spring/MySQL signup and TMDB; login/profile are week 7 publishing with local state",
    checks,
    requests,
    dialogs,
    responsive,
    consoleErrors: errors,
  };
  writeFileSync(
    join(output, "verification.json"),
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify({ checks, consoleErrors: errors }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ requests, dialogs, errors }));
  throw error;
} finally {
  if (browser) await browser.close();
  await server.close();
}
