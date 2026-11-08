import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMovies } from "../../api/movies/get-movies";
import MovieGrid from "../../components/movies/movie-grid";
import Pagination from "../../components/movies/pagination";
export function MovieListPage() {
  const [page, setPage] = useState(1);
  const moviesQuery = useQuery({
    queryKey: ["movies", "list", { page }],
    queryFn: ({ signal }) => getMovies({ page }, signal),
  });
  const movies = moviesQuery.data?.results ?? [];
  const totalPages = moviesQuery.data?.total_pages ?? 0;
  return (
    <main className="mx-auto w-[calc(100%-40px)] max-w-[1280px] min-[801px]:w-[calc(100%-64px)] min-[1101px]:w-[calc(100%-160px)] flex-1 pt-6 pb-12 min-[561px]:pb-[88px]">
      <h1 className="mb-[22px] text-[28px] leading-9 font-extrabold tracking-[-1px] min-[801px]:text-[36px] min-[801px]:leading-[44px]">
        영화 목록
      </h1>
      {moviesQuery.isPending ? (
        <p role="status" className="py-12 text-muted">
          영화 목록을 불러오는 중이에요.
        </p>
      ) : moviesQuery.isError ? (
        <p role="alert" className="py-12 text-muted">
          영화 목록을 불러오지 못했어요.
        </p>
      ) : movies.length === 0 ? (
        <p role="status" className="py-12 text-muted">
          조건에 맞는 영화가 없어요.
        </p>
      ) : (
        <>
          <MovieGrid movies={movies} />
          <Pagination
            currentPage={page}
            totalPages={Math.min(totalPages, 500)}
            onPageChange={setPage}
          />
        </>
      )}
    </main>
  );
}
