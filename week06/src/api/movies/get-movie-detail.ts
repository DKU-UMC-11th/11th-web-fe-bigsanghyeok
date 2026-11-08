import { getTmdbClient } from "../tmdb-client";
import type { TmdbMovieDetail } from "./models";
export type GetMovieDetailResponse = TmdbMovieDetail;
export async function getMovieDetail(movieId: number, signal?: AbortSignal) {
  return getTmdbClient()
    .get(`movie/${movieId}`, {
      searchParams: { language: "ko-KR" },
      signal,
    })
    .json<GetMovieDetailResponse>();
}
