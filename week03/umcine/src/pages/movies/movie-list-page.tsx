import { useMemo, useState } from "react";
import MovieGrid from "../../components/movies/movie-grid";
import Pagination from "../../components/movies/pagination";
import { useMovieLibrary } from "../../components/movies/movie-library-provider";

const PAGE_SIZE = 10;
// 제공된 영화 목록 화면의 카드 순서입니다. 원본 데이터는 수정하지 않아요.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 10, 9];

export function MovieListPage() {
  const { movies, toggleBookmark } = useMovieLibrary();
  const orderedMovies = useMemo(
    () =>
      [...movies].sort(
        (a, b) => DISPLAY_ORDER.indexOf(a.id) - DISPLAY_ORDER.indexOf(b.id),
      ),
    [movies],
  );
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(orderedMovies.length / PAGE_SIZE);
  const visibleMovies = orderedMovies.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function handlePageChange(page: number) {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  }

  return (
    <main className="mx-auto w-[calc(100%-40px)] max-w-[1280px] min-[801px]:w-[calc(100%-64px)] min-[1101px]:w-[calc(100%-160px)] flex-1 pt-6 pb-12 min-[561px]:pb-[88px]">
      <h1 className="mb-[22px] text-[28px] leading-9 font-extrabold tracking-[-1px] min-[561px]:text-[30px] min-[561px]:leading-10 min-[801px]:text-[36px] min-[801px]:leading-[44px] min-[801px]:tracking-[-1.8px]">
        영화 목록
      </h1>
      <MovieGrid movies={visibleMovies} onToggleBookmark={toggleBookmark} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </main>
  );
}
