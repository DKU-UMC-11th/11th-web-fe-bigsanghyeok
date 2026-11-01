import { cn } from "../../utils/cn";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
const buttonClass =
  "grid size-9 place-items-center rounded-[7px] font-bold disabled:opacity-20";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav
      className="mt-9 flex justify-center gap-3"
      aria-label="영화 목록 페이지"
    >
      <button
        type="button"
        aria-label="이전 페이지"
        className={buttonClass}
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <img src="/icons/chevron-left.svg" alt="" width="24" height="24" />
      </button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map(
        (page) => (
          <button
            key={page}
            type="button"
            aria-label={page + "페이지"}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              buttonClass,
              page === currentPage ? "bg-ink text-white" : "text-ink",
            )}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ),
      )}
      <button
        type="button"
        aria-label="다음 페이지"
        className={buttonClass}
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <img src="/icons/chevron-right.svg" alt="" width="24" height="24" />
      </button>
    </nav>
  );
}
