import { Link } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { getMovieDetail } from "../../api/movies/get-movie-detail";
import {
  useProfile,
  ProfileAvatar,
} from "../../components/profile/profile-provider";
import { useBookmarkStore } from "../../stores/bookmark-store";
import MovieGrid from "../../components/movies/movie-grid";
import { primaryButton } from "../../components/auth/auth-field";
export function MyPage() {
  const { profile } = useProfile();
  const ids = useBookmarkStore((state) => state.bookmarkedMovieIds);
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["movies", "detail", id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getMovieDetail(id, signal),
      staleTime: 30000,
    })),
  });
  const movies = queries.flatMap((query) =>
    query.data
      ? [
          {
            ...query.data,
            genre_ids: query.data.genres.map((genre) => genre.id),
          },
        ]
      : [],
  );
  return (
    <main className="mx-auto w-[calc(100%-40px)] max-w-[1280px] flex-1 pt-6 pb-16 min-[801px]:w-[calc(100%-64px)] min-[1101px]:w-[calc(100%-160px)]">
      <div className="mb-7 flex items-center justify-between gap-3">
        <h1 className="text-[28px] font-extrabold tracking-[-1px]">내 정보</h1>
        <Link
          to="/my/edit"
          className={primaryButton + " inline-flex items-center"}
        >
          정보 수정
        </Link>
      </div>
      <section aria-label="기본 정보" className="border-y border-border py-3">
        <h2 className="text-base font-bold">기본 정보</h2>
        <div className="mt-4 flex flex-wrap items-center gap-6 pb-1 sm:gap-7">
          <ProfileAvatar image={profile.image} />
          <dl className="grid min-w-0 flex-1 gap-5 sm:grid-cols-2 lg:grid-cols-[374px_minmax(0,1fr)]">
            <div>
              <dt className="text-[11px] text-subtle">닉네임</dt>
              <dd className="mt-1 text-sm font-bold wrap-anywhere">
                {profile.nickname}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-subtle">이메일</dt>
              <dd className="mt-1 text-sm font-bold wrap-anywhere">
                {profile.email}
              </dd>
            </div>
          </dl>
        </div>
      </section>
      <section aria-label="내 즐겨찾기" className="mt-7">
        <h2 className="mb-4 text-base font-bold">내 즐겨찾기</h2>
        {ids.length === 0 ? (
          <p className="py-12 text-sm text-muted">
            아직 즐겨찾기한 영화가 없어요.
          </p>
        ) : (
          <>
            {queries.some((query) => query.isPending) && (
              <p role="status" className="mb-4 text-sm text-muted">
                즐겨찾기한 영화를 불러오는 중이에요.
              </p>
            )}
            {queries.some((query) => query.isError) && (
              <p role="alert" className="mb-4 text-sm text-muted">
                일부 즐겨찾기 영화를 불러오지 못했어요.
              </p>
            )}
            {movies.length > 0 && <MovieGrid movies={movies} />}
          </>
        )}
      </section>
    </main>
  );
}
