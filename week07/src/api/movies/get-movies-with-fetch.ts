import { getTmdbEnv } from "../../config/env";
import type { TmdbMovieListResponse } from "./models";

export async function getMoviesWithFetch(
  signal?: AbortSignal,
): Promise<TmdbMovieListResponse> {
  const env = getTmdbEnv();
  const url = new URL(env.tmdbApiBaseUrl + "/movie/popular");
  url.search = new URLSearchParams({ language: "ko-KR", page: "1" }).toString();
  const response = await fetch(url, {
    headers: { Authorization: "Bearer " + env.tmdbAccessToken },
    signal,
  });
  if (!response.ok) throw new Error("인기 영화 요청 실패: " + response.status);
  return response.json();
}
