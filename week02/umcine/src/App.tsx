import { useState } from "react";
import Header from "./components/header";
import Footer from "./components/footer";
import MovieGrid from "./components/movie-grid";
import Pagination from "./components/pagination";
import { movies as initialMovies } from "./data/movies";
import "./App.css";

const PAGE_SIZE = 10;
// 제공된 영화 목록 화면의 카드 순서입니다. 원본 데이터는 수정하지 않아요.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 10, 9];

export default function App() {
  const [movies, setMovies] = useState(() =>
    [...initialMovies].sort((a, b) => DISPLAY_ORDER.indexOf(a.id) - DISPLAY_ORDER.indexOf(b.id)),
  );
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(movies.length / PAGE_SIZE);
  const visibleMovies = movies.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleToggleBookmark(movieId: number) {
    setMovies((currentMovies) =>
      currentMovies.map((movie) =>
        movie.id === movieId
          ? { ...movie, isBookmarked: !movie.isBookmarked }
          : movie,
      ),
    );
  }

  function handlePageChange(page: number) {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  }

  return (
    <>
      <Header />
      <main className="movie-page container">
        <h1>영화 목록</h1>
        <MovieGrid movies={visibleMovies} onToggleBookmark={handleToggleBookmark} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </main>
      <Footer />
    </>
  );
}
