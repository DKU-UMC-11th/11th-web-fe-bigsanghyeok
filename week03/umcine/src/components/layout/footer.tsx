export default function Footer() {
  return (
    <footer className="shrink-0 border-t border-border bg-white">
      <div className="mx-auto w-[calc(100%-40px)] max-w-[1280px] min-[801px]:w-[calc(100%-64px)] min-[1101px]:w-[calc(100%-160px)] flex min-h-[55px] items-start justify-start gap-2 py-[18px] min-[561px]:items-center min-[561px]:justify-end min-[561px]:py-0">
        <img
          src="/images/logos/tmdb-logo.svg"
          alt="TMDB"
          className="mt-[5px] block h-auto w-6 shrink-0 min-[561px]:mt-0"
        />
        <p className="text-[11px] leading-[18px] text-muted min-[561px]:text-xs">
          This product uses the TMDB API but is not endorsed or certified by{" "}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            TMDB.
          </a>
        </p>
      </div>
    </footer>
  );
}
