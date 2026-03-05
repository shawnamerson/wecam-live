import { Link } from 'react-router-dom';
import { usePageMeta } from '../../hooks/usePageMeta';

const posts = [
  {
    slug: 'best-omegle-alternatives-2026',
    title: 'Best Omegle Alternatives in 2026: Sites Like Omegle to Talk to Strangers',
    excerpt: 'Omegle is gone, but random video chat lives on. We compare the top sites like Omegle and chat roulette alternatives available in 2026 to talk to strangers for free.',
    date: 'February 24, 2026'
  },
  {
    slug: 'video-chat-safety-tips',
    title: 'How to Stay Safe Talking to Strangers on Random Video Chat',
    excerpt: 'Talking to strangers online can be fun, but safety comes first. Learn practical tips to protect your privacy on Omegle alternatives and chat roulette sites like WeCam.',
    date: 'February 22, 2026'
  },
  {
    slug: 'what-happened-to-omegle',
    title: 'What Happened to Omegle? Why It Shut Down & Where to Chat Now',
    excerpt: 'After 14 years of letting people talk to strangers, Omegle shut down in November 2023. Here\'s the full story and the best Omegle alternatives to use now.',
    date: 'February 20, 2026'
  }
];

export default function BlogIndex() {
  usePageMeta({
    title: 'Blog - Random Video Chat Tips, Omegle Alternatives & More',
    description: 'WeCam blog — articles about random video chat, sites like Omegle, online safety tips for talking to strangers, and the future of anonymous video chat.',
    path: '/blog'
  });

  return (
    <main className="content-page">
      <div className="content-container">
        <h1>WeCam Blog</h1>
        <p className="blog-intro">
          Thoughts on random video chat, Omegle alternatives, chat roulette, online safety for talking to strangers, and connecting with people around the world.
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
