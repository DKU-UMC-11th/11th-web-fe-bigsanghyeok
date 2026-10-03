import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { movies as initialMovies } from "../../data/movies";
import type { Movie } from "../../types/movie";

export interface MovieReview {
  rating: number;
  comment: string;
}
interface Preferences {
  bookmarks: Record<number, boolean>;
  reviews: Partial<Record<number, MovieReview>>;
}
interface MovieLibrary extends Preferences {
  movies: Movie[];
  toggleBookmark: (movieId: number) => void;
  saveReview: (movieId: number, review: MovieReview) => void;
}
const STORAGE_KEY = "umcine-movie-preferences-v1";
const MovieLibraryContext = createContext<MovieLibrary | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readPreferences(): Preferences {
  const preferences: Preferences = {
    bookmarks: Object.fromEntries(
      initialMovies.map((movie) => [movie.id, movie.isBookmarked]),
    ),
    reviews: {},
  };
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "null",
    );
    if (!isRecord(saved)) return preferences;
    for (const movie of initialMovies) {
      const bookmark = isRecord(saved.bookmarks)
        ? saved.bookmarks[movie.id]
        : undefined;
      if (typeof bookmark === "boolean")
        preferences.bookmarks[movie.id] = bookmark;
      const review = isRecord(saved.reviews)
        ? saved.reviews[movie.id]
        : undefined;
      if (
        isRecord(review) &&
        typeof review.rating === "number" &&
        Number.isInteger(review.rating) &&
        review.rating >= 1 &&
        review.rating <= 5 &&
        typeof review.comment === "string"
      ) {
        preferences.reviews[movie.id] = {
          rating: review.rating,
          comment: review.comment.slice(0, 1000),
        };
      }
    }
  } catch {
    // 저장소가 차단되거나 저장된 값이 손상되면 기본 영화 데이터로 시작해요.
  }
  return preferences;
}

export function MovieLibraryProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(readPreferences);
  const movies = useMemo(
    () =>
      initialMovies.map((movie) => ({
        ...movie,
        isBookmarked: preferences.bookmarks[movie.id] ?? movie.isBookmarked,
      })),
    [preferences.bookmarks],
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // 저장소를 쓸 수 없어도 현재 화면의 즐겨찾기와 평점은 작동해요.
    }
  }, [preferences]);

  function toggleBookmark(movieId: number) {
    if (!initialMovies.some((movie) => movie.id === movieId)) return;
    setPreferences((current) => ({
      ...current,
      bookmarks: {
        ...current.bookmarks,
        [movieId]: !current.bookmarks[movieId],
      },
    }));
  }

  function saveReview(movieId: number, review: MovieReview) {
    if (
      !initialMovies.some((movie) => movie.id === movieId) ||
      !Number.isInteger(review.rating) ||
      review.rating < 1 ||
      review.rating > 5
    )
      return;
    setPreferences((current) => ({
      ...current,
      reviews: {
        ...current.reviews,
        [movieId]: {
          rating: review.rating,
          comment: review.comment.slice(0, 1000),
        },
      },
    }));
  }

  return (
    <MovieLibraryContext.Provider
      value={{ ...preferences, movies, toggleBookmark, saveReview }}
    >
      {children}
    </MovieLibraryContext.Provider>
  );
}

export function useMovieLibrary() {
  const library = useContext(MovieLibraryContext);
  if (!library) throw new Error("MovieLibraryProvider가 필요해요.");
  return library;
}
