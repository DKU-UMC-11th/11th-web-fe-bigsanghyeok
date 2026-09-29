export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner container">
        <a className="site-logo" href="./" aria-label="UMCine 홈">
          <span className="site-logo-mark">
            <img src="/icons/movie.svg" alt="" width="24" height="24" />
          </span>
          <span>UMCine</span>
        </a>
        <nav className="primary-navigation" aria-label="주 메뉴">
          <a href="./" aria-current="page">영화</a>
          {/* 검색·인증·내 정보 화면은 이후 주차에서 연결합니다. */}
          <button type="button" disabled>검색</button>
          <button type="button" disabled>내 정보</button>
        </nav>
        <div className="header-actions">
          <button className="search-button" type="button" aria-label="영화 검색" disabled>
            <img src="/icons/search.svg" alt="" width="24" height="24" />
          </button>
          <button className="login-button" type="button" disabled>로그인</button>
        </div>
      </div>
    </header>
  );
}
