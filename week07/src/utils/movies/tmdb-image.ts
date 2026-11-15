export function getTmdbPosterUrl(posterPath: string | null) {
  return posterPath ? "https://image.tmdb.org/t/p/w500" + posterPath : null;
}
export function getTmdbBackdropUrl(backdropPath: string | null) {
  return backdropPath
    ? "https://image.tmdb.org/t/p/w1280" + backdropPath
    : null;
}
