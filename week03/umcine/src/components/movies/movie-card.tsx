import { Link } from "@tanstack/react-router";
import type { Movie } from "../../types/movie";
import { cn } from "../../utils/cn";

interface MovieCardProps {
  movie: Movie;
  onToggleBookmark: (movieId: number) => void;
}

export default function MovieCard({ movie, onToggleBookmark }: MovieCardProps) {
  return (
    <article className="min-w-0">
      <div className="relative aspect-[242/274] overflow-hidden rounded-[10px] bg-[#e4e7ed]">
        <Link
          to="/movies/$movieId"
          params={{ movieId: String(movie.id) }}
          className="block h-full"
        >
          <img
            className="block h-full w-full object-cover"
            src={movie.posterPath}
            alt={movie.title + " 포스터"}
          />
        </Link>
        <button
          type="button"
          className={cn(
            "absolute top-[10px] right-[10px] grid size-[34px] place-items-center rounded-lg border p-0 text-white hover:shadow-[0_0_0_2px_#ffffff66] focus-visible:outline-white focus-visible:outline-offset-2",
            movie.isBookmarked
              ? "border-blue-600 bg-blue-600"
              : "border-gray-200 bg-[#181a1e]",
          )}
          aria-label={
            movie.title + (movie.isBookmarked ? " 북마크 해제" : " 북마크 추가")
          }
          aria-pressed={movie.isBookmarked}
          onClick={() => onToggleBookmark(movie.id)}
        >
          <img
            src={
              movie.isBookmarked
                ? "/icons/bookmark.svg"
                : "/icons/bookmark-outline.svg"
            }
            alt=""
            width="24"
            height="24"
            className="block invert"
          />
        </button>
      </div>
      <h2 className="mt-2 mb-0.5 text-sm leading-[18px] font-bold tracking-[-0.45px] wrap-anywhere">
        <Link
          to="/movies/$movieId"
          params={{ movieId: String(movie.id) }}
          className="hover:underline"
        >
          {movie.title}
        </Link>
      </h2>
      <time
        className="block text-xs leading-[18px] text-[#969eac]"
        dateTime={movie.releaseDate.replaceAll(".", "-")}
      >
        {movie.releaseDate}
      </time>
    </article>
  );
}
