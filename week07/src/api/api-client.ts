import ky from "ky";
import { getApiBaseUrl } from "../config/env";
let client: ReturnType<typeof ky.create> | undefined;
export function getApiClient() {
  return (client ??= ky.create({
    baseUrl: getApiBaseUrl(),
    timeout: 10000,
    retry: 0,
  }));
}
