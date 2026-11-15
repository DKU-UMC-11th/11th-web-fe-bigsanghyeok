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

export function getApiBaseUrl() {
  const value = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!value) throw new Error("회원 서버 주소를 확인해 주세요.");
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("올바른 회원 서버 주소가 필요해요.");
  return url.href.replace(/\/$/, "") + "/";
}
