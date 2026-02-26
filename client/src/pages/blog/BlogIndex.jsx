import { Link } from 'react-router-dom';
import { usePageMeta } from '../../hooks/usePageMeta';

const posts = [
  {
    slug: 'best-omegle-alternatives-2026',
    title: 'Best Omegle Alternatives in 2026',
    excerpt: 'Omegle is gone, but random video chat lives on. We compare the top Omegle alternatives available in 2026, from WeCam to Chatroulette and beyond.',
    date: 'February 24, 2026'
  },
  {
    slug: 'video-chat-safety-tips',
    title: 'How to Stay Safe on Random Video Chat',
    excerpt: 'Random video chat is fun, but safety comes first. Learn practical tips to protect your privacy and have a positive experience on platforms like WeCam.',
    date: 'February 22, 2026'
  },
  {
    slug: 'what-happened-to-omegle',
    title: 'What Happened to Omegle?',
    excerpt: 'After 14 years connecting strangers, Omegle shut down in November 2023. Here\'s the full story of what happened and where users went next.',
    date: 'February 20, 2026'
  }
];

export default function BlogIndex() {
  usePageMeta({
    title: 'Blog',
    description: 'WeCam blog — articles about random video chat, Omegle alternatives, online safety tips, and the future of connecting with strangers online.',
    path: '/blog'
  });

  return (
    <main className="content-page">
      <div className="content-container">
        <h1>WeCam Blog</h1>
        <p className="blog-intro">
          Thoughts on random video chat, online safety, and connecting with people around the world.
        </p>

        <div className="blog-list">
          {posts.map((post) => (
            <article key={post.slug} className="blog-card">
              <Link to={`/blog/${post.slug}`}>
                <h2>{post.title}</h2>
                <time dateTime={post.date}>{post.date}</time>
                <p>{post.excerpt}</p>
                <span className="blog-read-more">Read more</span>
              </Link>
            </article>
          ))}
        </div>

        <div className="content-cta">
          <p>Want to try WeCam for yourself?</p>
          <Link to="/" className="btn btn-start">Start Chatting</Link>
        </div>
      </div>
    </main>
  );
}
