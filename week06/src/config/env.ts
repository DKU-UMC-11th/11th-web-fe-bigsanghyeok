export function getTmdbEnv() {
  const baseUrl = import.meta.env.VITE_TMDB_API_BASE_URL?.trim();
  const token = import.meta.env.VITE_TMDB_ACCESS_TOKEN?.trim();
  if (!baseUrl || !token) throw new Error("TMDB 환경 변수를 확인해 주세요.");
  const url = new URL(baseUrl);
  if (url.protocol !== "https:")
    throw new Error("TMDB API는 HTTPS를 사용해요.");
  return {
    tmdbApiBaseUrl: url.href.replace(/\/$/, ""),
    tmdbAccessToken: token,
  };
}
