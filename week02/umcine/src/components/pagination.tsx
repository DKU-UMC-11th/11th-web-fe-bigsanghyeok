interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // 한 페이지인 영화 목록에서는 컨트롤을 숨겨 제공된 화면과 맞춥니다.
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="영화 목록 페이지">
      <button
        type="button"
        aria-label="이전 페이지"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <img src="/icons/chevron-left.svg" alt="" width="24" height="24" />
      </button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <button
          type="button"
          key={page}
          aria-label={page + "페이지"}
          aria-current={page === currentPage ? "page" : undefined}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        aria-label="다음 페이지"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <img src="/icons/chevron-right.svg" alt="" width="24" height="24" />
      </button>
    </nav>
  );
}
