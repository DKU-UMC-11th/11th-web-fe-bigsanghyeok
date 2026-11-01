import { Link } from "@tanstack/react-router";
import type { Movie } from "../../types/movie";
import { BookmarkButton } from "./bookmark-button";

interface MovieCardProps {
  movie: Movie;
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
          <img
            className="block h-full w-full object-cover"
            src={movie.posterPath}
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
        dateTime={movie.releaseDate.replaceAll(".", "-")}
      >
        {movie.releaseDate}
      </time>
    </article>
  );
}
