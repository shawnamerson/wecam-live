import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export default function About() {
  usePageMeta({
    title: 'About WeCam - Free Omegle Alternative to Talk to Strangers',
    description: 'WeCam is a free random video chat site where you can talk to strangers anonymously. No signup, no download — the best Omegle alternative and chat roulette platform.',
    path: '/about'
  });

  return (
    <main className="content-page">
      <article className="content-container">
        <h1>About WeCam - Talk to Strangers with Free Video Chat</h1>

        <section>
          <h2>What Is WeCam?</h2>
          <p>
            WeCam is a free random video chat platform that lets you talk to strangers from around the world.
            Think of it as the modern successor to Omegle and a safe chat roulette alternative — simple, anonymous,
            and instant. No accounts, no downloads, no fees. Just open your browser, click Start, and you're
            face-to-face with someone new.
          </p>
        </section>

        <section>
          <h2>How It Works</h2>
          <p>
            WeCam uses WebRTC (Web Real-Time Communication) to create direct peer-to-peer video connections
            between users. When you click Start, your browser requests camera and microphone access. Once
            granted, our signaling server pairs you with another user who's also looking for a chat partner.
          </p>
          <p>
            The video and audio streams flow directly between you and your chat partner — they never pass
            through our servers. This means faster connections, lower latency, and better privacy. If you
            want to talk to someone else, just click Next and you'll be matched with a new partner instantly.
          </p>
        </section>

        <section>
          <h2>Why WeCam?</h2>
          <ul>
            <li><strong>100% Free</strong> — No premium tiers, no hidden costs, no subscriptions. Free video chat with strangers.</li>
            <li><strong>No Signup Required</strong> — Talk to strangers in seconds without creating an account.</li>
            <li><strong>No Download Needed</strong> — Works entirely in your web browser on any device.</li>
            <li><strong>Safe &amp; Anonymous</strong> — Peer-to-peer connections mean your video never touches our servers.</li>
            <li><strong>Global Community</strong> — Meet strangers online from every corner of the world.</li>
            <li><strong>Mobile Friendly</strong> — Full camera switching support on phones and tablets.</li>
          </ul>
        </section>

        <section>
          <h2>Our Mission: The Best Omegle Replacement</h2>
          <p>
            After Omegle shut down in November 2023, millions of people lost their go-to platform for
            talking to strangers via video chat. WeCam was built to fill that gap — providing the same
            simple, anonymous video chat experience with a modern, clean interface. Whether you called it
            chat roulette or just "sites like Omegle," WeCam is the replacement you've been looking for.
          </p>
          <p>
            We believe that connecting with people from different backgrounds and cultures makes the world
            a more interesting place. WeCam makes those connections effortless.
          </p>
        </section>

        <section>
          <h2>What You Need</h2>
          <p>
            All you need is a device with a camera and microphone and a modern web browser. WeCam works on
            Chrome, Firefox, Safari, and Edge — on desktop, phone, or tablet. No plugins or extensions required.
          </p>
        </section>

        <div className="content-cta">
          <p>Ready to meet someone new?</p>
          <Link to="/" className="btn btn-start">Start Chatting</Link>
        </div>

        <nav className="content-links" aria-label="Related pages">
          <p>Learn more:</p>
          <Link to="/faq">Frequently Asked Questions</Link>
          <Link to="/blog">Read Our Blog</Link>
          <Link to="/blog/video-chat-safety-tips">Safety Tips</Link>
        </nav>
      </article>
    </main>
  );
}
