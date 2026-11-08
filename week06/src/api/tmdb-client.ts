import ky from "ky";
import { getTmdbEnv } from "../config/env";

let client: ReturnType<typeof ky.create> | undefined;

// 설정 오류도 요청을 시작한 화면의 오류 상태에서 처리해요.
export function getTmdbClient() {
  if (client) return client;
  const env = getTmdbEnv();
  client = ky.create({
    baseUrl: env.tmdbApiBaseUrl + "/",
    headers: { Authorization: "Bearer " + env.tmdbAccessToken },
    timeout: 10000,
    retry: 0,
  });
  return client;
}
