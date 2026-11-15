import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { isRecord } from "../../utils/bookmark-storage";

export interface MovieReview {
  rating: number;
  comment: string;
}
type Reviews = Partial<Record<number, MovieReview>>;
interface ReviewContextValue {
  reviews: Reviews;
  saveReview: (movieId: number, review: MovieReview) => void;
}
const REVIEW_STORAGE_KEY = "umcine-reviews";
const ReviewContext = createContext<ReviewContextValue | null>(null);

function readReviews(): Reviews {
  const reviews: Reviews = {};
  try {
    const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
    const saved: unknown =
      raw !== null
        ? JSON.parse(raw)
        : JSON.parse(
            localStorage.getItem("umcine-movie-preferences-v1") ?? "null",
          )?.reviews;
    if (!isRecord(saved)) return reviews;
    for (const [key, review] of Object.entries(saved)) {
      const movieId = Number(key);
      if (!Number.isSafeInteger(movieId) || movieId <= 0) continue;
      if (
        isRecord(review) &&
        typeof review.rating === "number" &&
        Number.isInteger(review.rating) &&
        review.rating >= 1 &&
        review.rating <= 5 &&
        typeof review.comment === "string"
      )
        reviews[movieId] = {
          rating: review.rating,
          comment: review.comment.slice(0, 1000),
        };
    }
  } catch {
    /* 기존 평점 기능은 북마크와 별도로 복원해요. */
  }
  return reviews;
}

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState(readReviews);
  useEffect(() => {
    try {
      localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
    } catch {
      /* 저장소가 차단되어도 평점을 입력할 수 있어요. */
    }
  }, [reviews]);
  function saveReview(movieId: number, review: MovieReview) {
    if (
      !Number.isSafeInteger(movieId) ||
      movieId <= 0 ||
      !Number.isInteger(review.rating) ||
      review.rating < 1 ||
      review.rating > 5
    )
      return;
    setReviews((current) => ({
      ...current,
      [movieId]: {
        rating: review.rating,
        comment: review.comment.slice(0, 1000),
      },
    }));
  }
  return (
    <ReviewContext.Provider value={{ reviews, saveReview }}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useMovieReviews() {
  const context = useContext(ReviewContext);
  if (!context) throw new Error("ReviewProvider가 필요해요.");
  return context;
}
