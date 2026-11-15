import { getApiClient } from "../api-client";
export interface CheckNicknameDuplicateResponse {
  available: boolean;
}
export async function checkNicknameDuplicate(value: string) {
  return getApiClient()
    .get(`members/nickname/${encodeURIComponent(value)}`)
    .json<CheckNicknameDuplicateResponse>();
}
