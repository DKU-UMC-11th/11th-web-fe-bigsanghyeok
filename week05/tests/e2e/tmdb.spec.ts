import { test, expect, type Page } from "@playwright/test";

const movie = {
  id: 550,
  title: "파이트 클럽",
  original_title: "Fight Club",
  overview: "평범한 일상을 벗어난 두 사람의 이야기.",
  poster_path: "/poster.jpg",
  backdrop_path: "/backdrop.jpg",
  release_date: "1999-10-15",
  vote_average: 8.4,
  vote_count: 100,
  genre_ids: [18],
};
const response = (results = [movie]) => ({
  page: 1,
  results,
  total_pages: 1,
  total_results: results.length,
});
const detail = {
  ...movie,
  genres: [{ id: 18, name: "드라마" }],
  runtime: 139,
  tagline: "첫 번째 규칙",
};
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="100%" height="100%" fill="#334155"/></svg>';

async function images(page: Page) {
  await page.route("https://image.tmdb.org/**", (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: svg }),
  );
}
async function api(page: Page) {
  await images(page);
  await page.route("https://api.themoviedb.org/3/**", (route) => {
    const url = new URL(route.request().url());
    return route.fulfill({
      json: /\/movie\/\d+$/.test(url.pathname) ? detail : response(),
    });
  });
}
test("실제 화면은 ky 요청의 인증·검색 조건을 보내고 fetch도 동일한 응답을 읽는다", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await api(page);
  const requestPromise = page.waitForRequest((r) =>
    r.url().includes("/movie/popular"),
  );
  await page.goto("/");
  const request = await requestPromise;
  expect(new URL(request.url()).searchParams.get("language")).toBe("ko-KR");
  expect(new URL(request.url()).searchParams.get("page")).toBe("1");
  expect(request.headers()["authorization"]).toBe("Bearer e2e-test-token");
  await expect(page.getByRole("heading", { name: movie.title })).toBeVisible();
  await expect(
    page.getByText("This product uses the TMDB API", { exact: false }),
  ).toBeVisible();
  const result = await page.evaluate(async () => {
    const modulePath = "/src/api/movies/get-movies-with-fetch.ts";
    const { getMoviesWithFetch } = await import(/* @vite-ignore */ modulePath);
    return getMoviesWithFetch();
  });
  expect(result.results[0].id).toBe(550);
  await page.reload();
  await expect(page.getByRole("heading", { name: movie.title })).toBeVisible();
  expect(errors).toEqual([]);
});

test("목록 로딩에서 빈 결과로 전환한다", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/3/movie/popular?**", async (route) => {
    await gate;
    await route.fulfill({ json: response([]) });
  });
  await page.goto("/");
  await expect(page.getByText("영화 목록을 불러오는 중이에요.")).toBeVisible();
  release();
  await expect(page.getByText("조건에 맞는 영화가 없어요.")).toBeVisible();
});
test("목록 네트워크 실패를 처리한다", async ({ page }) => {
  await page.route("**/3/movie/popular?**", (route) => route.abort("failed"));
  await page.goto("/");
  await expect(page.getByRole("alert")).toHaveText(
    "영화 목록을 불러오지 못했어요.",
  );
});
test("빈 검색어에는 API를 호출하지 않는다", async ({ page }) => {
  let calls = 0;
  page.on("request", (r) => {
    if (r.url().includes("/search/movie")) calls++;
  });
  await page.goto("/search?query=%20%20");
  await expect(page.getByText("검색어를 입력해 주세요.")).toBeVisible();
  expect(calls).toBe(0);
});
test("검색 조건·결과 정보·상세 링크·직접 접근·새로고침·뒤로가기를 확인한다", async ({
  page,
}) => {
  await api(page);
  const requested = page.waitForRequest((r) =>
    r.url().includes("/search/movie"),
  );
  await page.goto("/search?query=파이트%20%26%20클럽");
  const url = new URL((await requested).url());
  expect(url.searchParams.get("query")).toBe("파이트 & 클럽");
  expect(url.searchParams.get("include_adult")).toBe("false");
  await expect(page.getByText("영화 1편")).toBeVisible();
  await expect(page.getByRole("heading", { name: movie.title })).toBeVisible();
  await expect(page.getByText(movie.original_title)).toBeVisible();
  await expect(page.getByText(movie.release_date)).toBeVisible();
  await expect(page.getByText(movie.overview)).toBeVisible();
  await expect(
    page.getByRole("img", { name: movie.title + " 포스터" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("link", { name: "상세 보기" }).click();
  await expect(page).toHaveURL(/\/movies\/550$/);
  await expect(page.getByText("2시간 19분")).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("textbox", { name: "검색어" })).toHaveValue(
    "파이트 & 클럽",
  );
  await page.getByRole("textbox", { name: "검색어" }).fill("다른 영화");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(page).toHaveURL(/query=/);
  await expect(
    page.getByRole("heading", { name: "‘다른 영화’ 검색 결과" }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("textbox", { name: "검색어" })).toHaveValue(
    "파이트 & 클럽",
  );
  await page.goForward();
  await expect(page.getByRole("textbox", { name: "검색어" })).toHaveValue(
    "다른 영화",
  );
});
test("검색 로딩·빈 결과·HTTP 오류를 구분한다", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/3/search/movie?**", async (route) => {
    await gate;
    await route.fulfill({ json: response([]) });
  });
  await page.goto("/search?query=없음");
  await expect(page.getByText("검색 결과를 불러오는 중이에요.")).toBeVisible();
  release();
  await expect(page.getByText("검색 결과가 없어요.")).toBeVisible();
  await page.unroute("**/3/search/movie?**");
  await page.route("**/3/search/movie?**", (route) =>
    route.fulfill({ status: 401, json: { status_message: "Unauthorized" } }),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toHaveText(
    "검색 결과를 불러오지 못했어요.",
  );
});
test("검색어가 바뀌면 오래 걸린 이전 응답이 새 결과를 덮어쓰지 않는다", async ({
  page,
}) => {
  await images(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let oldStarted!: () => void;
  const oldRequest = new Promise<void>((resolve) => {
    oldStarted = resolve;
  });
  await page.route("**/3/search/movie?**", async (route) => {
    if (new URL(route.request().url()).searchParams.get("query") === "이전") {
      oldStarted();
      await gate;
      await route
        .fulfill({ json: response([{ ...movie, title: "이전 결과" }]) })
        .catch(() => {});
    } else
      await route.fulfill({
        json: response([{ ...movie, title: "최신 결과" }]),
      });
  });
  await page.goto("/search?query=이전");
  await oldRequest;
  await page.getByRole("textbox", { name: "검색어" }).fill("최신");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "최신 결과", exact: true }),
  ).toBeVisible();
  release();
  await expect(
    page.getByRole("heading", { name: "이전 결과", exact: true }),
  ).toHaveCount(0);
});
test("상세 직접 접근·새로고침과 북마크·평점 복원을 확인한다", async ({
  page,
}) => {
  await api(page);
  await page.goto("/movies/550");
  await expect(page.getByText(movie.original_title)).toBeVisible();
  await expect(page.getByText("드라마", { exact: true })).toBeVisible();
  await expect(page.getByText("첫 번째 규칙")).toBeVisible();
  await page
    .getByRole("button", { name: movie.title + " 북마크 추가" })
    .click();
  await page.getByRole("button", { name: "4점", exact: true }).click();
  await page
    .getByRole("textbox", { name: "후기" })
    .fill("새로운 TMDB ID에도 저장돼요.");
  await page.getByRole("button", { name: "평점 저장" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: movie.title + " 북마크 해제" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "4점", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("textbox", { name: "후기" })).toHaveValue(
    "새로운 TMDB ID에도 저장돼요.",
  );
  await page.getByRole("link", { name: "영화 목록", exact: true }).click();
  await expect(
    page.getByRole("button", { name: movie.title + " 북마크 해제" }),
  ).toHaveAttribute("aria-pressed", "true");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("umcine-bookmark-store")!),
  );
  expect(saved.state.bookmarkedMovieIds).toEqual([550]);
  expect(Object.keys(saved.state)).toEqual(["bookmarkedMovieIds"]);
});
test("잘못된 ID에는 요청하지 않고 404와 다른 오류를 구분한다", async ({
  page,
}) => {
  let count = 0;
  await page.route("**/3/movie/**", (route) => {
    count++;
    return route.fulfill({ status: 404, json: {} });
  });
  for (const id of ["abc", "0", "-1", "1.5"]) {
    await page.goto("/movies/" + id);
    await expect(page.getByText("올바르지 않은 영화 번호예요.")).toBeVisible();
  }
  expect(count).toBe(0);
  await page.goto("/movies/999999999");
  await expect(page.getByRole("alert")).toHaveText("영화를 찾을 수 없어요.");
  await page.unroute("**/3/movie/**");
  await page.route("**/3/movie/**", (route) =>
    route.fulfill({ status: 500, json: {} }),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toHaveText(
    "영화 정보를 불러오지 못했어요.",
  );
});
test("포스터·배경·상영 시간·줄거리가 없는 응답을 표시한다", async ({
  page,
}) => {
  await page.route("**/3/movie/**", (route) =>
    route.fulfill({
      json: {
        ...detail,
        poster_path: null,
        backdrop_path: null,
        runtime: null,
        overview: "",
      },
    }),
  );
  await page.goto("/movies/550");
  await expect(page.getByText("이미지 없음", { exact: true })).toHaveCount(2);
  await expect(page.getByText("상영 시간 정보가 없어요.")).toBeVisible();
  await expect(page.getByText("줄거리 정보가 없어요.")).toBeVisible();
  expect(await page.locator('img[src=""]').count()).toBe(0);
});
test("목록·검색의 null 포스터와 깨진 이미지도 같은 영역에 대체한다", async ({
  page,
}) => {
  await page.route("**/3/**", (route) =>
    route.fulfill({ json: response([{ ...movie, poster_path: null }]) }),
  );
  await page.goto("/");
  await expect(page.getByText("이미지 없음")).toBeVisible();
  await page.goto("/search?query=영화");
  await expect(page.getByText("이미지 없음")).toBeVisible();
  await page.unroute("**/3/**");
  await page.route("**/3/**", (route) => route.fulfill({ json: response() }));
  await page.route("https://image.tmdb.org/**", (route) =>
    route.fulfill({ status: 404 }),
  );
  await page.goto("/");
  await expect(page.getByText("이미지 없음")).toBeVisible();
});
test("API 페이지 이동은 최대 5개 번호로 유지되고 반응형에 가로 스크롤이 없다", async ({
  page,
}) => {
  await images(page);
  await page.route("**/3/movie/popular?**", (route) => {
    const pageNumber = Number(
      new URL(route.request().url()).searchParams.get("page"),
    );
    return route.fulfill({
      json: {
        ...response(),
        page: pageNumber,
        total_pages: 1000,
        results: [{ ...movie, title: "페이지 " + pageNumber }],
      },
    });
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "페이지 1", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "영화 목록 페이지" })
      .getByRole("button"),
  ).toHaveCount(7);
  await page.getByRole("button", { name: "다음 페이지", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "페이지 2", exact: true }),
  ).toBeVisible();
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1024 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
