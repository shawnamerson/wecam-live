import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export default function NotFound() {
  usePageMeta({
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist. Return to WeCam to start a free random video chat.',
    path: '/404'
  });

  return (
    <main className="not-found-page">
      <div className="not-found-container">
        <h1>404</h1>
        <p className="not-found-message">This page doesn't exist.</p>
        <p className="not-found-sub">But there are plenty of real people waiting to chat!</p>
        <div className="not-found-actions">
          <Link to="/" className="btn btn-start">Start Chatting</Link>
          <Link to="/blog" className="btn btn-next">Read Our Blog</Link>
        </div>
        <nav className="not-found-links" aria-label="Site pages">
          <Link to="/about">About</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/blog">Blog</Link>
        </nav>
      </div>
    </main>
  );
}
