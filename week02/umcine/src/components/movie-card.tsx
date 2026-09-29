import type { Movie } from "../types/movie";

interface MovieCardProps {
  movie: Movie;
  onToggleBookmark: (movieId: number) => void;
}

export default function MovieCard({ movie, onToggleBookmark }: MovieCardProps) {
  return (
    <article className="movie-card">
      <div className="movie-poster">
        <img className="poster-image" src={movie.posterPath} alt={movie.title + " 포스터"} />
        <button
          type="button"
          className="bookmark-button"
          aria-label={movie.title + (movie.isBookmarked ? " 북마크 해제" : " 북마크 추가")}
          aria-pressed={movie.isBookmarked}
          onClick={() => onToggleBookmark(movie.id)}
        >
          <img
            src={movie.isBookmarked ? "/icons/bookmark.svg" : "/icons/bookmark-outline.svg"}
            alt=""
            width="24"
            height="24"
          />
        </button>
      </div>
      <h2 className="movie-title">{movie.title}</h2>
      <time className="movie-release-date" dateTime={movie.releaseDate.replaceAll(".", "-")}>
        {movie.releaseDate}
      </time>
    </article>
  );
}
