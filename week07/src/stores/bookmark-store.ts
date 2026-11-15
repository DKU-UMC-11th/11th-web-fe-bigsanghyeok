import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  BOOKMARK_STORAGE_KEY,
  bookmarkStorage,
  isRecord,
  validBookmarkIds,
} from "../utils/bookmark-storage";

interface BookmarkStore {
  bookmarkedMovieIds: number[];
  toggleBookmark: (movieId: number) => void;
}

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set) => ({
      bookmarkedMovieIds: [],
      toggleBookmark: (movieId) => {
        if (!Number.isInteger(movieId) || movieId <= 0) return;
        set((state) => ({
          bookmarkedMovieIds: state.bookmarkedMovieIds.includes(movieId)
            ? state.bookmarkedMovieIds.filter((id) => id !== movieId)
            : [...state.bookmarkedMovieIds, movieId],
        }));
      },
    }),
    {
      name: BOOKMARK_STORAGE_KEY,
      storage: createJSONStorage(() => bookmarkStorage),
      partialize: (state) => ({ bookmarkedMovieIds: state.bookmarkedMovieIds }),
      merge: (saved, current) => ({
        ...current,
        bookmarkedMovieIds: validBookmarkIds(
          isRecord(saved) ? saved.bookmarkedMovieIds : undefined,
        ),
      }),
    },
  ),
);
