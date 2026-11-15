import { useBookmarkStore } from "../../stores/bookmark-store";
import { cn } from "../../utils/cn";

interface BookmarkButtonProps {
  movieId: number;
  title: string;
  variant?: "poster" | "detail";
}

export function BookmarkButton({
  movieId,
  title,
  variant = "poster",
}: BookmarkButtonProps) {
  const isBookmarked = useBookmarkStore((state) =>
    state.bookmarkedMovieIds.includes(movieId),
  );
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark);
  return (
    <button
      type="button"
      aria-label={title + (isBookmarked ? " 북마크 해제" : " 북마크 추가")}
      aria-pressed={isBookmarked}
      onClick={() => toggleBookmark(movieId)}
      className={cn(
        variant === "poster"
          ? "absolute top-[10px] right-[10px] grid size-[34px] place-items-center rounded-lg border p-0 text-white hover:shadow-[0_0_0_2px_#ffffff66] focus-visible:outline-white focus-visible:outline-offset-2"
          : "mt-3 inline-flex h-10 items-center gap-2 rounded-[7px] px-3 text-sm font-bold text-white",
        variant === "poster"
          ? isBookmarked
            ? "border-blue-600 bg-blue-600"
            : "border-gray-200 bg-[#181a1e]"
          : isBookmarked
            ? "bg-blue-700 hover:bg-blue-800"
            : "bg-primary hover:bg-blue-700",
      )}
    >
      <img
        src={
          isBookmarked ? "/icons/bookmark.svg" : "/icons/bookmark-outline.svg"
        }
        alt=""
        width="24"
        height="24"
        className="block invert"
      />
      {variant === "detail" && "즐겨찾기"}
    </button>
  );
}
