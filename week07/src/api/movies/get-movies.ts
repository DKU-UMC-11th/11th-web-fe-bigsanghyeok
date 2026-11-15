import { getTmdbClient } from "../tmdb-client";
import type { TmdbMovieListResponse } from "./models";
export interface GetMoviesRequest {
  page?: number;
}
export type GetMoviesResponse = TmdbMovieListResponse;
export async function getMovies(
  { page = 1 }: GetMoviesRequest = {},
  signal?: AbortSignal,
) {
  return getTmdbClient()
    .get("movie/popular", {
      searchParams: { language: "ko-KR", page },
      signal,
    })
    .json<GetMoviesResponse>();
}
