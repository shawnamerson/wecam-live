import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export default function FAQ() {
  usePageMeta({
    title: 'FAQ',
    description: 'Frequently asked questions about WeCam, the free Omegle alternative. Learn about features, safety, privacy, and how to get started with random video chat.',
    path: '/faq'
  });

  const faqs = [
    {
      q: 'What is WeCam?',
      a: 'WeCam is a free random video chat platform and the best Omegle alternative. It connects you with strangers worldwide for instant face-to-face conversations, with no signup or downloads required.'
    },
    {
      q: 'Is WeCam free to use?',
      a: 'Yes, WeCam is completely free. There are no hidden fees, subscriptions, or premium tiers. All features including random video chat, camera switching, and unlimited conversations are available at no cost.'
    },
    {
      q: 'Do I need to sign up or create an account?',
      a: 'No, WeCam requires no signup, registration, or account creation. Simply visit wecam.live, allow camera access, and click Start to begin chatting with strangers instantly.'
    },
    {
      q: 'Is WeCam safe to use?',
      a: 'WeCam uses peer-to-peer WebRTC connections for video chat, meaning video streams go directly between users without passing through our servers. No personal information is collected or stored. You can skip any conversation instantly by clicking Next.'
    },
    {
      q: 'What happened to Omegle?',
      a: 'Omegle shut down in November 2023 after 14 years of operation. WeCam is a modern alternative that provides the same random video chat experience with a clean interface, no downloads, and instant connections.'
    },
    {
      q: 'What do I need to use WeCam?',
      a: 'You need a device with a camera and microphone (computer, phone, or tablet) and a modern web browser that supports WebRTC, such as Chrome, Firefox, Safari, or Edge. No additional software or plugins are required.'
    },
    {
      q: 'Can I use WeCam on my phone?',
      a: 'Yes! WeCam is fully mobile-friendly and works on both iOS and Android devices. You can also switch between front and rear cameras during a chat.'
    },
    {
      q: 'How do I skip someone?',
      a: 'Simply click the "Next" button to end the current conversation and be matched with a new partner instantly. There\'s no limit to how many times you can skip.'
    },
    {
      q: 'Is my video recorded or stored?',
      a: 'No. WeCam uses peer-to-peer WebRTC connections, so your video and audio streams go directly to your chat partner. They never pass through or are stored on our servers.'
    },
    {
      q: 'Why can\'t I see my camera?',
      a: 'Make sure you\'ve granted camera permission when your browser asks. You can also check your browser\'s site settings to ensure camera access is allowed for wecam.live. If you\'re still having trouble, try a different browser or device.'
    }
  ];

  return (
    <main className="content-page">
      <article className="content-container">
        <h1>Frequently Asked Questions</h1>

        <div className="faq-list">
          {faqs.map((faq, i) => (
            <details key={i} className="faq-item">
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>

        <div className="content-cta">
          <p>Have more questions? Try WeCam for yourself!</p>
          <Link to="/" className="btn btn-start">Start Chatting</Link>
        </div>

        <nav className="content-links" aria-label="Related pages">
          <p>Learn more:</p>
          <Link to="/about">About WeCam</Link>
          <Link to="/blog/video-chat-safety-tips">Safety Tips</Link>
          <Link to="/blog/what-happened-to-omegle">What Happened to Omegle?</Link>
        </nav>
      </article>
    </main>
  );
}
