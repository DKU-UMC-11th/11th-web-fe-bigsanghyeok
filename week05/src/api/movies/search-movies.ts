import { getTmdbClient } from "../tmdb-client";
import type { TmdbMovieListResponse } from "./models";
export interface SearchMoviesRequest {
  query: string;
  page?: number;
}
export type SearchMoviesResponse = TmdbMovieListResponse;
export async function searchMovies(
  { query, page = 1 }: SearchMoviesRequest,
  signal?: AbortSignal,
) {
  return getTmdbClient()
    .get("search/movie", {
      searchParams: { query, language: "ko-KR", include_adult: false, page },
      signal,
    })
    .json<SearchMoviesResponse>();
}
