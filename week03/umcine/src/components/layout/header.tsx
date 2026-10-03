import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "../../utils/cn";

const navLink =
  "text-sm leading-normal font-bold whitespace-nowrap underline-offset-[3px] decoration-[1.5px]";

export function Header() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  return (
    <header className="shrink-0 border-b border-border bg-white">
      <div className="mx-auto w-[calc(100%-40px)] max-w-[1280px] min-[801px]:w-[calc(100%-64px)] min-[1101px]:w-[calc(100%-160px)] flex min-h-[104px] flex-wrap items-center gap-[14px] py-[14px] min-[561px]:h-[76px] min-[561px]:min-h-0 min-[561px]:flex-nowrap min-[561px]:gap-0 min-[561px]:py-0 min-[801px]:h-[89px]">
        <Link
          to="/"
          aria-label="UMCine 홈"
          className="inline-flex shrink-0 items-center gap-[10px] text-lg font-black tracking-[-0.8px] min-[561px]:text-xl"
        >
          <span className="grid size-8 place-items-center rounded-[7px] border-2">
            <img src="/icons/movie.svg" alt="" width="24" height="24" />
          </span>
          <span>UMCine</span>
        </Link>
        <nav
          aria-label="주 메뉴"
          className="order-1 flex w-full items-center gap-6 min-[561px]:order-none min-[561px]:ml-7 min-[561px]:w-auto min-[561px]:gap-5 min-[801px]:ml-11 min-[801px]:gap-8"
        >
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className={cn(
              navLink,
              pathname === "/"
                ? "text-ink underline"
                : "text-muted hover:text-ink",
            )}
            activeProps={{ "aria-current": "page" }}
          >
            영화
          </Link>
          <Link
            to="/search"
            className={cn(
              navLink,
              pathname === "/search"
                ? "text-ink underline"
                : "text-muted hover:text-ink",
            )}
            activeProps={{ "aria-current": "page" }}
          >
            검색
          </Link>
          <button type="button" disabled className={cn(navLink, "text-muted")}>
            내 정보
          </button>
        </nav>
        <div className="ml-auto flex items-center gap-2 min-[561px]:gap-3">
          <Link
            to="/search"
            aria-label="영화 검색"
            className="grid size-9 place-items-center rounded-lg border border-border bg-white min-[561px]:size-[42px]"
          >
            <img
              src="/icons/search.svg"
              alt=""
              width="24"
              height="24"
              className="opacity-[0.62]"
            />
          </Link>
          <button
            type="button"
            disabled
            className="h-9 rounded-[7px] border border-transparent bg-primary px-3 text-[13px] font-bold text-white min-[561px]:h-10 min-[561px]:px-[17px] min-[561px]:text-sm"
          >
            로그인
          </button>
        </div>
      </div>
    </header>
  );
}
