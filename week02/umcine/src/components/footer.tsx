export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner container">
        <img className="tmdb-logo" src="/images/logos/tmdb-logo.svg" alt="TMDB" />
        <p>
          This product uses the TMDB API but is not endorsed or certified by{" "}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDB.</a>
        </p>
      </div>
    </footer>
  );
}
