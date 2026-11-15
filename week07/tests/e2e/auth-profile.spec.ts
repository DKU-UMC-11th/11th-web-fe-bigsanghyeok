import { test, expect, type Page } from "@playwright/test";

async function fillSignup(page: Page) {
  await page
    .getByLabel("이메일", { exact: true })
    .fill(" new.user@example.com ");
  await page.getByLabel("닉네임", { exact: true }).fill(" 새회원07 ");
  await page.getByLabel("비밀번호", { exact: true }).fill("Movie123!");
  await page.getByLabel("비밀번호 확인", { exact: true }).fill("Movie123!");
}
function dialogs(page: Page) {
  const messages: string[] = [];
  page.on("dialog", async (dialog) => {
    messages.push(dialog.message());
    await dialog.accept();
  });
  return messages;
}
async function available(page: Page) {
  await page.route("http://localhost:8080/members/**", (route) =>
    route.fulfill({ json: { available: true } }),
  );
}
async function checkBoth(page: Page) {
  await page
    .getByRole("button", { name: "이메일 중복 확인", exact: true })
    .click();
  await page
    .getByRole("button", { name: "닉네임 중복 확인", exact: true })
    .click();
}

test("회원가입은 입력한 필드만 검증하고 두 중복 확인 후 제출을 허용한다", async ({
  page,
}) => {
  dialogs(page);
  await available(page);
  await page.goto("/signup");
  await expect(
    page.getByRole("heading", { name: "회원가입", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "가입하기", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText("비밀번호가 일치하지 않아요.")).toHaveCount(0);
  await page.getByLabel("이메일", { exact: true }).fill("bad");
  await expect(page.getByLabel("이메일", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByLabel("닉네임", { exact: true }).fill("가");
  await expect(
    page.getByText("닉네임은 2~12자로 입력해 주세요."),
  ).toBeVisible();
  await page.getByLabel("비밀번호", { exact: true }).fill("movie123!");
  await expect(page.getByLabel("비밀번호", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByLabel("비밀번호 확인", { exact: true }).fill("different");
  await expect(page.getByText("비밀번호가 일치하지 않아요.")).toBeVisible();
  await fillSignup(page);
  await expect(
    page.getByRole("button", { name: "가입하기", exact: true }),
  ).toBeDisabled();
  await checkBoth(page);
  await expect(
    page.getByRole("button", { name: "가입하기", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("닉네임", { exact: true }).fill("수정회원");
  await expect(
    page.getByRole("button", { name: "가입하기", exact: true }),
  ).toBeDisabled();
});

test("중복 확인 중 입력을 잠그고 사용 중인 값과 요청 실패를 알린다", async ({
  page,
}) => {
  const messages = dialogs(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route("http://localhost:8080/members/email/**", async (route) => {
    await gate;
    await route.fulfill({ json: { available: false } });
  });
  await page.goto("/signup");
  await fillSignup(page);
  await page
    .getByRole("button", { name: "이메일 중복 확인", exact: true })
    .click();
  await expect(page.getByLabel("이메일", { exact: true })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "이메일 중복 확인", exact: true }),
  ).toBeDisabled();
  release();
  await expect.poll(() => messages).toContain("이미 사용 중인 이메일이에요.");
  await expect(page.getByLabel("이메일", { exact: true })).toBeEnabled();
  await page.route("http://localhost:8080/members/nickname/**", (route) =>
    route.abort("failed"),
  );
  await page
    .getByRole("button", { name: "닉네임 중복 확인", exact: true })
    .click();
  await expect
    .poll(() => messages)
    .toContain("중복 확인에 실패했어요. 다시 시도해 주세요.");
  await expect(
    page.getByRole("button", { name: "가입하기", exact: true }),
  ).toBeDisabled();
});

test("가입 요청은 확인 비밀번호 없이 전송하고 중복 제출을 막는다", async ({
  page,
}) => {
  const messages = dialogs(page);
  await available(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const bodies: unknown[] = [];
  let authHeader: string | undefined;
  await page.route("http://localhost:8080/members", async (route) => {
    bodies.push(route.request().postDataJSON());
    authHeader = route.request().headers()["authorization"];
    await gate;
    await route.fulfill({
      status: 201,
      json: {
        isSuccess: true,
        code: "CREATED",
        message: "회원가입에 성공했습니다.",
        result: {
          memberId: 3,
          email: "new.user@example.com",
          nickname: "새회원07",
        },
      },
    });
  });
  await page.goto("/signup");
  await fillSignup(page);
  await checkBoth(page);
  await page.getByRole("button", { name: "가입하기", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "가입 중", exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("비밀번호", { exact: true })).toBeDisabled();
  await page.locator("main form").evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
    (form as HTMLFormElement).requestSubmit();
  });
  expect(bodies).toEqual([
    {
      email: "new.user@example.com",
      nickname: "새회원07",
      password: "Movie123!",
    },
  ]);
  expect(authHeader).toBeUndefined();
  release();
  await expect.poll(() => messages).toContain("회원가입에 성공했습니다.");
  await expect(
    page.getByRole("button", { name: "가입하기", exact: true }),
  ).toBeEnabled();
});

test("회원가입 HTTP 실패와 비즈니스 실패 후 입력을 유지해 재시도한다", async ({
  page,
}) => {
  const messages = dialogs(page);
  await available(page);
  let attempt = 0;
  await page.route("http://localhost:8080/members", (route) => {
    attempt++;
    return route.fulfill({
      status: attempt === 1 ? 409 : 200,
      json: {
        isSuccess: false,
        code: "CONFLICT",
        message: "이미 사용 중이에요.",
        result: null,
      },
    });
  });
  await page.goto("/signup");
  await fillSignup(page);
  await checkBoth(page);
  await page.getByRole("button", { name: "가입하기", exact: true }).click();
  await expect.poll(() => messages.length).toBe(3);
  expect(messages[2]).toBe("회원가입에 실패했어요. 다시 시도해 주세요.");
  await expect(page.getByLabel("비밀번호", { exact: true })).toHaveValue(
    "Movie123!",
  );
  await page.getByRole("button", { name: "가입하기", exact: true }).click();
  await expect.poll(() => messages.length).toBe(4);
  expect(messages[3]).toBe("회원가입에 실패했어요. 다시 시도해 주세요.");
  expect(attempt).toBe(2);
});

test("로그인 화면에서 입력과 회원가입 이동을 확인하며 인증 API를 호출하지 않는다", async ({
  page,
}) => {
  let authRequests = 0;
  page.on("request", (r) => {
    if (r.url().includes("localhost:8080")) authRequests++;
  });
  await page.goto("/login");
  const button = page
    .locator("main")
    .getByRole("button", { name: "로그인", exact: true });
  await expect(button).toBeDisabled();
  await page.getByLabel("이메일", { exact: true }).fill("login@example.com");
  await page.getByLabel("비밀번호", { exact: true }).fill("Movie123!");
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.getByRole("status")).toHaveText(
    "로그인 정보를 입력했어요.",
  );
  expect(authRequests).toBe(0);
  await page.getByRole("link", { name: "회원가입", exact: true }).click();
  await expect(page).toHaveURL(/\/signup$/);
});

test("헤더에서 내 정보에 접근하고 닉네임·이미지 변경을 저장한다", async ({
  page,
}) => {
  dialogs(page);
  await available(page);
  await page.goto("/login");
  await page
    .locator("header nav")
    .getByRole("link", { name: "내 정보", exact: true })
    .click();
  await expect(page.getByText("gs0428", { exact: true })).toBeVisible();
  await expect(page.getByText("아직 즐겨찾기한 영화가 없어요.")).toBeVisible();
  await page.getByRole("link", { name: "정보 수정", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "내 정보 수정", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("이메일", { exact: true })).toHaveAttribute(
    "readonly",
    "",
  );
  await page.getByLabel("닉네임", { exact: true }).fill("대상혁07");
  await expect(
    page.getByRole("button", { name: "변경사항 저장", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "중복 확인", exact: true }).click();
  const pixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/nN0AAAAASUVORK5CYII=",
    "base64",
  );
  await page
    .getByLabel("프로필 이미지 파일", { exact: true })
    .setInputFiles({
      name: "profile.png",
      mimeType: "image/png",
      buffer: pixel,
    });
  await expect(
    page.getByRole("img", { name: "프로필 이미지", exact: true }),
  ).toHaveAttribute("src", /^data:image\/png;base64,/);
  await page
    .getByRole("button", { name: "변경사항 저장", exact: true })
    .click();
  await expect(page).toHaveURL(/\/my$/);
  await expect(page.getByText("대상혁07", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("img", { name: "프로필 이미지", exact: true }),
  ).toBeVisible();
  await page
    .locator("header nav")
    .getByRole("link", { name: "검색", exact: true })
    .click();
  await page.goBack();
  await expect(page.getByText("대상혁07", { exact: true })).toBeVisible();
});

test("프로필 파일 형식·5MB 제한·닉네임 오류와 중복 닉네임을 처리한다", async ({
  page,
}) => {
  const messages = dialogs(page);
  await page.route("http://localhost:8080/members/nickname/**", (route) =>
    route.fulfill({ json: { available: false } }),
  );
  await page.goto("/my/edit");
  await page
    .getByLabel("프로필 이미지 파일")
    .setInputFiles({
      name: "file.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("text"),
    });
  await expect(page.getByRole("alert")).toHaveText(
    "5MB 이하의 이미지 파일을 선택해 주세요.",
  );
  await page
    .getByLabel("프로필 이미지 파일")
    .setInputFiles({
      name: "large.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    });
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByLabel("닉네임", { exact: true }).fill("가");
  await expect(
    page.getByRole("button", { name: "변경사항 저장", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("닉네임", { exact: true }).fill("사용중닉네임");
  await page.getByRole("button", { name: "중복 확인", exact: true }).click();
  await expect.poll(() => messages).toContain("이미 사용 중인 닉네임이에요.");
  await expect(
    page.getByRole("button", { name: "변경사항 저장", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "회원 탈퇴", exact: true }),
  ).toBeDisabled();
});

test("내 즐겨찾기는 기존 Zustand의 TMDB ID로 표시하고 해제하면 빈 목록을 보여 준다", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "umcine-bookmark-store",
      JSON.stringify({ state: { bookmarkedMovieIds: [550] }, version: 0 }),
    ),
  );
  await page.route("**/3/movie/550?**", (route) =>
    route.fulfill({
      json: {
        id: 550,
        title: "파이트 클럽",
        original_title: "Fight Club",
        poster_path: null,
        backdrop_path: null,
        release_date: "1999-10-15",
        overview: "줄거리",
        genres: [],
        runtime: 139,
        tagline: "",
        vote_average: 8,
        vote_count: 1,
      },
    }),
  );
  await page.goto("/my");
  await expect(
    page.getByRole("heading", { name: "파이트 클럽", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "파이트 클럽 북마크 해제", exact: true })
    .click();
  await expect(page.getByText("아직 즐겨찾기한 영화가 없어요.")).toBeVisible();
});

test("새 네 화면의 직접 접근·새로고침·반응형과 Console을 확인한다", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  for (const [route, heading] of [
    ["/signup", "회원가입"],
    ["/login", "로그인"],
    ["/my", "내 정보"],
    ["/my/edit", "내 정보 수정"],
  ]) {
    await page.goto(route);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1024 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
    }
  }
  expect(errors).toEqual([]);
});
