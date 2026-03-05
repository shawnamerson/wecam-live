import { Link } from 'react-router-dom';
import { usePageMeta } from '../../hooks/usePageMeta';

const posts = [
  {
    slug: 'video-chat-without-signing-up',
    title: 'Video Chat Without Signing Up: The Best Free Options',
    excerpt: 'No account? No problem. Discover the best platforms for free anonymous video chat with no signup, no download, and no registration required.',
    date: 'March 3, 2026'
  },
  {
    slug: 'is-random-video-chat-safe',
    title: 'Is Random Video Chat Safe? A Complete Guide',
    excerpt: 'Is random video chat safe? Learn about the real risks, how to protect yourself, and what to look for in a safe video chat platform.',
    date: 'March 1, 2026'
  },
  {
    slug: 'how-to-meet-people-online-for-free',
    title: 'How to Meet People Online for Free: Best Ways in 2026',
    excerpt: 'From random video chat to forums and social apps, here are the best free ways to meet strangers online and make real connections in 2026.',
    date: 'February 27, 2026'
  },
  {
    slug: 'omegle-shut-down-what-to-use',
    title: 'Omegle Shut Down: What to Use Now for Random Video Chat',
    excerpt: 'Omegle is gone. Here\'s what to use instead — the best free Omegle replacements for random video chat with strangers in 2026.',
    date: 'February 25, 2026'
  },
  {
    slug: 'best-omegle-alternatives-2026',
    title: 'Best Omegle Alternatives in 2026: Sites Like Omegle to Talk to Strangers',
    excerpt: 'Omegle is gone, but random video chat lives on. We compare the top sites like Omegle and chat roulette alternatives available in 2026.',
    date: 'February 24, 2026'
  },
  {
    slug: 'chat-roulette-vs-omegle-alternatives',
    title: 'Chat Roulette vs Omegle Alternatives: Which Is Best?',
    excerpt: 'Chat Roulette and Omegle pioneered random video chat. We compare the two models and today\'s best alternatives.',
    date: 'February 23, 2026'
  },
  {
    slug: 'video-chat-safety-tips',
    title: 'Video Chat Safety Tips for Talking to Strangers',
    excerpt: 'Talking to strangers online can be fun, but safety comes first. Practical tips to protect your privacy on video chat platforms.',
    date: 'February 22, 2026'
  },
  {
    slug: 'what-happened-to-omegle',
    title: 'What Happened to Omegle? Why It Shut Down & Where to Chat Now',
    excerpt: 'After 14 years of letting people talk to strangers, Omegle shut down in November 2023. Here\'s the full story.',
    date: 'February 20, 2026'
  }
];

export default function BlogIndex() {
  usePageMeta({
    title: 'Blog - Video Chat Tips & Omegle Alternatives',
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
