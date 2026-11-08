import { getMovieDetail } from "../../api/movies/get-movie-detail";
import { useQuery } from "@tanstack/react-query";
import { getMovieDetailErrorMessage } from "../../utils/movies/get-movie-detail-error-message";
import {
  getTmdbPosterUrl,
  getTmdbBackdropUrl,
} from "../../utils/movies/tmdb-image";
import { formatRuntime } from "../../utils/movies/format-runtime";
import { MovieImage } from "../../components/movies/movie-image";
import { BookmarkButton } from "../../components/movies/bookmark-button";
import { Link, useParams } from "@tanstack/react-router";
import { useState, type SubmitEvent } from "react";
import {
  useMovieReviews,
  type MovieReview,
} from "../../components/movies/review-provider";
import type { TmdbMovieDetail } from "../../api/movies/models";
import { cn } from "../../utils/cn";

export function MovieDetailPage() {
  const { movieId } = useParams({ from: "/movies/$movieId" });
  const { reviews, saveReview } = useMovieReviews();
  const parsedMovieId = Number(movieId);
  const valid = Number.isSafeInteger(parsedMovieId) && parsedMovieId > 0;
  const movieDetailQuery = useQuery({
    queryKey: ["movies", "detail", parsedMovieId],
    queryFn: ({ signal }) => getMovieDetail(parsedMovieId, signal),
    enabled: valid,
    staleTime: 30 * 1000,
  });
  if (!valid || movieDetailQuery.isPending || movieDetailQuery.isError)
    return (
      <main className="mx-auto w-[calc(100%-40px)] max-w-[1280px] min-[801px]:w-[calc(100%-64px)] min-[1101px]:w-[calc(100%-160px)] flex-1 py-12">
        <p role={movieDetailQuery.isError ? "alert" : "status"}>
          {!valid
            ? "올바르지 않은 영화 번호예요."
            : movieDetailQuery.isError
              ? getMovieDetailErrorMessage(movieDetailQuery.error)
              : "영화 정보를 불러오는 중이에요."}
        </p>
        <Link
          to="/"
          className="mt-4 inline-block font-bold text-primary hover:underline"
        >
          영화 목록
        </Link>
      </main>
    );
  const movie = movieDetailQuery.data;
  return (
    <MovieDetails
      key={movie.id}
      movie={movie}
      savedReview={reviews[movie.id]}
      onSaveReview={saveReview}
    />
  );
}

interface MovieDetailsProps {
  movie: TmdbMovieDetail;
  savedReview?: MovieReview;
  onSaveReview: (movieId: number, review: MovieReview) => void;
}

function MovieDetails({ movie, savedReview, onSaveReview }: MovieDetailsProps) {
  const [rating, setRating] = useState(savedReview?.rating ?? 0);
  const [comment, setComment] = useState(savedReview?.comment ?? "");
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  function handleSaveReview(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating === 0) {
      setFeedback({ kind: "error", message: "별점을 선택해 주세요." });
      return;
    }
    onSaveReview(movie.id, { rating, comment: comment.trim() });
    setComment(comment.trim());
    setFeedback({ kind: "success", message: "평점을 저장했어요." });
  }

  return (
    <main className="flex-1">
      <section
        aria-label="영화 정보"
        className="relative isolate min-h-[320px] bg-ink text-white sm:min-h-[360px]"
      >
        <MovieImage
          src={getTmdbBackdropUrl(movie.backdrop_path)}
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-r from-black/65 via-black/20 to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-t from-black/35 to-transparent"
        />
        <div className="mx-auto w-[calc(100%-40px)] max-w-[1280px] min-[801px]:w-[calc(100%-64px)] min-[1101px]:w-[calc(100%-160px)] flex min-h-[320px] flex-col items-start justify-between gap-12 pt-6 pb-6 sm:min-h-[360px]">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-bold hover:underline"
          >
            <img
              src="/icons/chevron-left.svg"
              alt=""
              width="24"
              height="24"
              className="invert"
            />
            영화 목록
          </Link>
          <div>
            <h1 className="text-3xl leading-tight font-extrabold tracking-[-1.4px] wrap-anywhere sm:text-[40px]">
              {movie.title}
            </h1>
            <p className="mt-3 text-sm leading-6">{movie.original_title}</p>
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[13px] leading-5 font-bold">
              <time dateTime={movie.release_date.replaceAll(".", "-")}>
                {movie.release_date || "개봉일 정보가 없어요."}
              </time>
              <p>{movie.genres.map((genre) => genre.name).join(", ")}</p>
              <p>{formatRuntime(movie.runtime)}</p>
            </div>
          </div>
        </div>
      </section>
      <section
        aria-label="줄거리와 내 평점"
        className="mx-auto w-[calc(100%-40px)] max-w-[1280px] min-[801px]:w-[calc(100%-64px)] min-[1101px]:w-[calc(100%-160px)] grid grid-cols-1 items-start gap-8 pt-6 pb-16 sm:grid-cols-[160px_minmax(0,1fr)] lg:grid-cols-[200px_minmax(0,1fr)_360px]"
      >
        <MovieImage
          src={getTmdbPosterUrl(movie.poster_path)}
          alt={movie.title + " 포스터"}
          className="aspect-[200/286] w-[200px] rounded-[10px] object-cover shadow-[0_12px_24px_#181a1e14] sm:w-[160px] lg:w-[200px]"
        />
        <div className="min-w-0">
          <h2 className="text-xl leading-7 font-bold tracking-[-0.5px]">
            {movie.tagline || movie.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            {movie.overview || "줄거리 정보가 없어요."}
          </p>
          <BookmarkButton
            movieId={movie.id}
            title={movie.title}
            variant="detail"
          />
        </div>
        <form
          onSubmit={handleSaveReview}
          className="min-w-0 border-t border-border pt-6 sm:col-span-2 lg:col-span-1 lg:min-h-[294px] lg:border-t-0 lg:border-l lg:pt-0 lg:pl-[30px]"
        >
          <fieldset>
            <legend className="text-xl leading-7 font-bold tracking-[-0.5px]">
              내 평점
            </legend>
            <p
              id="review-help"
              className="mt-1 text-xs leading-[18px] text-subtle"
            >
              별점은 필수, 후기는 선택이에요.
            </p>
            <div
              role="group"
              aria-label="별점 선택"
              aria-describedby="review-help"
              className="mt-2 flex flex-wrap gap-1"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={value + "점"}
                  aria-pressed={rating === value}
                  onClick={() => {
                    setRating(value);
                    setFeedback(null);
                  }}
                  className={cn(
                    "grid size-[38px] place-items-center rounded-lg border bg-white",
                    value <= rating
                      ? "border-primary/40"
                      : "border-border hover:border-muted",
                  )}
                >
                  <img
                    src="/icons/star.svg"
                    alt=""
                    width="24"
                    height="24"
                    className={cn(
                      value <= rating
                        ? "[filter:invert(32%)_sepia(93%)_saturate(2145%)_hue-rotate(214deg)_brightness(94%)_contrast(94%)]"
                        : "opacity-65",
                    )}
                  />
                </button>
              ))}
            </div>
            <label htmlFor="review-comment" className="sr-only">
              후기
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(event) => {
                setComment(event.target.value);
                setFeedback(null);
              }}
              maxLength={1000}
              placeholder="영화를 보고 느낀 점을 남겨보세요."
              className="mt-2 block min-h-[102px] w-full resize-none rounded-lg border border-border bg-white px-3 py-4 text-[13px] leading-6 placeholder:text-subtle"
            />
            <button
              type="submit"
              className="mt-2 h-10 w-full rounded-[7px] bg-ink text-sm font-bold text-white hover:bg-ink/85"
            >
              평점 저장
            </button>
            {feedback && (
              <p
                role={feedback.kind === "error" ? "alert" : "status"}
                className={cn(
                  "mt-3 text-sm leading-5",
                  feedback.kind === "error" ? "text-red-600" : "text-primary",
                )}
              >
                {feedback.message}
              </p>
            )}
          </fieldset>
        </form>
      </section>
    </main>
  );
}
