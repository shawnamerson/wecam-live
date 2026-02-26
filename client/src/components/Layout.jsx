import { Link, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="app">
      <nav className="site-nav" aria-label="Main navigation">
        <div className="nav-inner">
          <Link to="/" className="nav-brand">WeCam</Link>
          <div className="nav-links">
            <Link to="/about">About</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/blog">Blog</Link>
          </div>
        </div>
      </nav>
      <Outlet />
      <footer className="site-footer">
        <nav aria-label="Footer navigation">
          <div className="footer-links">
            <Link to="/about">About</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
          <p className="footer-copy">&copy; {new Date().getFullYear()} WeCam &mdash; Free Omegle alternative for random video chat</p>
        </nav>
      </footer>
    </div>
  );
}
