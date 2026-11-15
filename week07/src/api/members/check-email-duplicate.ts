import { getApiClient } from "../api-client";
export interface CheckEmailDuplicateResponse {
  available: boolean;
}
export async function checkEmailDuplicate(value: string) {
  return getApiClient()
    .get(`members/email/${encodeURIComponent(value)}`)
    .json<CheckEmailDuplicateResponse>();
}
