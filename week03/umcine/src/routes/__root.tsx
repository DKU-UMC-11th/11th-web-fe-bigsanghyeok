import {
  createRootRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { Header } from "../components/layout/header";
import Footer from "../components/layout/footer";
import { MovieLibraryProvider } from "../components/movies/movie-library-provider";

function RootLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  return (
    <MovieLibraryProvider>
      <Header />
      <Outlet />
      {pathname !== "/search" && <Footer />}
    </MovieLibraryProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <main className="mx-auto w-[calc(100%-40px)] max-w-[1280px] min-[801px]:w-[calc(100%-64px)] min-[1101px]:w-[calc(100%-160px)] flex-1 py-12">
      <p>페이지를 찾을 수 없어요.</p>
      <Link
        to="/"
        className="mt-4 inline-block font-bold text-primary hover:underline"
      >
        영화 목록
      </Link>
    </main>
  ),
});
