import type { StateStorage } from "zustand/middleware";

export const BOOKMARK_STORAGE_KEY = "umcine-bookmark-store";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validBookmarkIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(
        (id): id is number =>
          typeof id === "number" && Number.isInteger(id) && id > 0,
      ),
    ),
  ];
}

// 저장소 접근 실패와 손상된 JSON을 처리하고, 상태의 형태는 store의 merge에서 검사해요.
export const bookmarkStorage: StateStorage = {
  getItem(name) {
    try {
      const raw = localStorage.getItem(name);
      if (raw === null) return null;
      const saved: unknown = JSON.parse(raw);
      if (
        !isRecord(saved) ||
        !isRecord(saved.state) ||
        (saved.version !== undefined && saved.version !== 0)
      )
        return null;
      return raw;
    } catch {
      return null;
    }
  },
  setItem(name, value) {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* 저장할 수 없어도 현재 탭의 북마크는 사용할 수 있어요. */
    }
  },
  removeItem(name) {
    try {
      localStorage.removeItem(name);
    } catch {
      /* 다른 기능의 저장값은 지우지 않아요. */
    }
  },
};
