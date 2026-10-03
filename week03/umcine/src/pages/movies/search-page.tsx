import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type SubmitEvent } from "react";
import { useMovieLibrary } from "../../components/movies/movie-library-provider";
import { cn } from "../../utils/cn";

export function SearchPage() {
  const { query } = useSearch({ from: "/search" });
  const navigate = useNavigate({ from: "/search" });
  const { movies } = useMovieLibrary();
  const [searchText, setSearchText] = useState(query ?? "");
  useEffect(() => {
    setSearchText(query ?? "");
  }, [query]);
  const normalizedQuery = query?.trim().toLowerCase() ?? "";
  const searchResults = normalizedQuery
    ? movies.filter(
        (movie) =>
          movie.title.toLowerCase().includes(normalizedQuery) ||
          movie.originalTitle.toLowerCase().includes(normalizedQuery),
      )
    : [];

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = searchText.trim();
    void navigate({ search: nextQuery ? { query: nextQuery } : {} });
  }

  return (
    <main
      className={cn(
        "mx-auto w-[calc(100%-40px)] max-w-[1280px] min-[801px]:w-[calc(100%-64px)] min-[1101px]:w-[calc(100%-160px)] flex-1 pb-16",
        normalizedQuery ? "pt-6" : "pt-24 sm:pt-[208px]",
      )}
    >
      <h1
        className={cn(
          "font-extrabold tracking-[-1.4px]",
          normalizedQuery
            ? "mb-[22px] text-[28px] leading-9 sm:text-[36px] sm:leading-[44px]"
            : "mb-10 text-center text-[28px] leading-9 sm:text-[40px] sm:leading-[52px]",
        )}
      >
        {normalizedQuery ? "영화 검색" : "어떤 영화를 찾고 있나요?"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex h-[74px] items-center gap-3 rounded-xl border-2 border-ink bg-white pr-3 pl-3 shadow-[0_12px_30px_#181a1e0d] sm:gap-4 sm:pr-4 sm:pl-6",
          !normalizedQuery && "mx-auto max-w-[790px]",
        )}
      >
        <img
          src="/icons/search.svg"
          alt=""
          width="24"
          height="24"
          className="shrink-0 opacity-60"
        />
        <input
          aria-label="검색어"
          placeholder="예: 스파이더맨"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          className="min-w-0 flex-1 rounded-sm bg-transparent p-1 text-base placeholder:text-subtle"
        />
        <button
          type="submit"
          className="h-[42px] shrink-0 rounded-lg bg-ink px-[18px] text-sm font-bold text-white hover:bg-ink/85"
        >
          검색
        </button>
      </form>
      {!normalizedQuery ? (
        <p className="mt-6 text-center text-sm text-muted">
          검색어를 입력해 주세요.
        </p>
      ) : (
        <section aria-label="검색 결과" className="mt-10">
          <h2 className="text-xl leading-7 font-bold wrap-anywhere">
            ‘{query}’ 검색 결과
          </h2>
          <p className="mt-2 mb-5 text-sm text-muted" role="status">
            영화 {searchResults.length}편
          </p>
          {searchResults.length === 0 ? (
            <p className="py-12 text-center text-muted">검색 결과가 없어요.</p>
          ) : (
            <ul className="grid gap-5 lg:grid-cols-2">
              {searchResults.map((movie) => (
                <li
                  key={movie.id}
                  className="flex min-w-0 gap-4 rounded-xl border border-border bg-white p-4 sm:gap-6"
                >
                  <Link
                    to="/movies/$movieId"
                    params={{ movieId: String(movie.id) }}
                    className="w-24 shrink-0 sm:w-32"
                  >
                    <img
                      src={movie.posterPath}
                      alt={movie.title + " 포스터"}
                      className="aspect-[2/3] w-full rounded-lg object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg leading-6 font-bold wrap-anywhere">
                      <Link
                        to="/movies/$movieId"
                        params={{ movieId: String(movie.id) }}
                        className="hover:underline"
                      >
                        {movie.title}
                      </Link>
                    </h3>
                    <p className="mt-2 text-sm leading-5 text-muted wrap-anywhere">
                      {movie.originalTitle}
                    </p>
                    <time
                      dateTime={movie.releaseDate.replaceAll(".", "-")}
                      className="mt-1 block text-xs text-subtle"
                    >
                      {movie.releaseDate}
                    </time>
                    <p className="mt-4 text-sm leading-6 text-muted">
                      {movie.overview}
                    </p>
                    <Link
                      to="/movies/$movieId"
                      params={{ movieId: String(movie.id) }}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                    >
                      상세 보기
                      <img
                        src="/icons/arrow-right.svg"
                        alt=""
                        width="24"
                        height="24"
                      />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
