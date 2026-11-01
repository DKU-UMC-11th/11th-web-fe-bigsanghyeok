import { useCallback, useState } from "react";
import { getMovies } from "../../api/movies/get-movies";
import { useMovieRequest } from "../../hooks/use-movie-request";
import MovieGrid from "../../components/movies/movie-grid";
import Pagination from "../../components/movies/pagination";
const listError = () => "영화 목록을 불러오지 못했어요.";
export function MovieListPage() {
  const [page, setPage] = useState(1);
  const request = useCallback(
    (signal: AbortSignal) => getMovies({ page }, signal),
    [page],
  );
  const state = useMovieRequest(String(page), request, listError);
  return (
    <main className="mx-auto w-[calc(100%-40px)] max-w-[1280px] min-[801px]:w-[calc(100%-64px)] min-[1101px]:w-[calc(100%-160px)] flex-1 pt-6 pb-12 min-[561px]:pb-[88px]">
      <h1 className="mb-[22px] text-[28px] leading-9 font-extrabold tracking-[-1px] min-[801px]:text-[36px] min-[801px]:leading-[44px]">
        영화 목록
      </h1>
      {state.status === "loading" ? (
        <p role="status" className="py-12 text-muted">
          영화 목록을 불러오는 중이에요.
        </p>
      ) : state.status === "error" ? (
        <p role="alert" className="py-12 text-muted">
          {state.message}
        </p>
      ) : state.data.results.length === 0 ? (
        <p role="status" className="py-12 text-muted">
          조건에 맞는 영화가 없어요.
        </p>
      ) : (
        <>
          <MovieGrid movies={state.data.results} />
          <Pagination
            currentPage={page}
            totalPages={Math.min(state.data.total_pages, 500)}
            onPageChange={setPage}
          />
        </>
      )}
    </main>
  );
}
