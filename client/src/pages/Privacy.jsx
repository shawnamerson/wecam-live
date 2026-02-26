import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export default function Privacy() {
  usePageMeta({
    title: 'Privacy Policy',
    description: 'WeCam privacy policy. Learn how we protect your privacy with peer-to-peer video chat — no accounts, no data collection, no tracking.',
    path: '/privacy'
  });

  return (
    <main className="content-page">
      <article className="content-container legal-page">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: February 2026</p>

        <section>
          <h2>Overview</h2>
          <p>
            WeCam is built with privacy at its core. We use peer-to-peer WebRTC technology, which means your
            video and audio streams flow directly between you and your chat partner. They do not pass through
            or get stored on our servers.
          </p>
        </section>

        <section>
          <h2>Information We Do Not Collect</h2>
          <ul>
            <li>We do not require or collect names, email addresses, or any personal information.</li>
            <li>We do not record, store, or monitor video or audio streams.</li>
            <li>We do not use cookies for tracking purposes.</li>
            <li>We do not sell any data to third parties.</li>
          </ul>
        </section>

        <section>
          <h2>Information We Do Collect</h2>
          <p>
            Our signaling server temporarily processes socket connection IDs to pair users for video chat.
            These IDs are ephemeral and are discarded when you disconnect. We may collect basic, anonymized
            analytics (such as page views and user counts) to improve the service.
          </p>
        </section>

        <section>
          <h2>WebRTC and Peer-to-Peer Connections</h2>
          <p>
            WeCam uses WebRTC for video chat. WebRTC establishes a direct connection between your browser
            and your chat partner's browser. As part of this process, your IP address may be shared with
            your chat partner to establish the connection. This is a standard part of how WebRTC works
            and is not something we control or store.
          </p>
        </section>

        <section>
          <h2>Third-Party Services</h2>
          <p>
            We use Vercel Analytics for basic, privacy-friendly usage metrics. We use metered TURN servers
            to help establish peer-to-peer connections when direct connections aren't possible. These services
            have their own privacy policies.
          </p>
        </section>

        <section>
          <h2>Children's Privacy</h2>
          <p>
            WeCam is not intended for use by anyone under the age of 18. We do not knowingly collect
            information from children.
          </p>
        </section>

        <section>
          <h2>Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. Any changes will be reflected on this page
            with an updated date.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            If you have questions about this privacy policy, you can reach us through our website at wecam.live.
          </p>
        </section>

        <nav className="content-links" aria-label="Related pages">
          <Link to="/terms">Terms of Service</Link>
          <Link to="/about">About WeCam</Link>
          <Link to="/faq">FAQ</Link>
        </nav>
      </article>
    </main>
  );
}
