import { Link } from "@tanstack/react-router";
import type { TmdbMovieListItem } from "../../api/movies/models";
import { MovieImage } from "./movie-image";
import { getTmdbPosterUrl } from "../../utils/movies/tmdb-image";
import { BookmarkButton } from "./bookmark-button";

interface MovieCardProps {
  movie: TmdbMovieListItem;
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <article className="min-w-0">
      <div className="relative aspect-[242/274] overflow-hidden rounded-[10px] bg-[#e4e7ed]">
        <Link
          to="/movies/$movieId"
          params={{ movieId: String(movie.id) }}
          className="block h-full"
        >
          <MovieImage
            className="block h-full w-full object-cover"
            src={getTmdbPosterUrl(movie.poster_path)}
            alt={movie.title + " 포스터"}
          />
        </Link>
        <BookmarkButton movieId={movie.id} title={movie.title} />
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
        dateTime={movie.release_date.replaceAll(".", "-")}
      >
        {movie.release_date || "개봉일 정보가 없어요."}
      </time>
    </article>
  );
}
