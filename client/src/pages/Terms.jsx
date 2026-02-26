import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export default function Terms() {
  usePageMeta({
    title: 'Terms of Service',
    description: 'WeCam terms of service. Read the rules and guidelines for using our free random video chat platform.',
    path: '/terms'
  });

  return (
    <main className="content-page">
      <article className="content-container legal-page">
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: February 2026</p>

        <section>
          <h2>Acceptance of Terms</h2>
          <p>
            By accessing and using WeCam (wecam.live), you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use the service.
          </p>
        </section>

        <section>
          <h2>Description of Service</h2>
          <p>
            WeCam is a free random video chat platform that connects users for anonymous, real-time video
            conversations. The service is provided as-is and is free of charge.
          </p>
        </section>

        <section>
          <h2>Eligibility</h2>
          <p>
            You must be at least 18 years old to use WeCam. By using the service, you confirm that you
            meet this age requirement.
          </p>
        </section>

        <section>
          <h2>User Conduct</h2>
          <p>When using WeCam, you agree not to:</p>
          <ul>
            <li>Broadcast nudity, sexually explicit content, or illegal material.</li>
            <li>Harass, threaten, or abuse other users.</li>
            <li>Record other users without their consent.</li>
            <li>Use the service for any illegal purpose.</li>
            <li>Attempt to interfere with or disrupt the service.</li>
            <li>Impersonate another person or misrepresent your identity.</li>
            <li>Use automated tools, bots, or scripts to access the service.</li>
          </ul>
        </section>

        <section>
          <h2>Privacy</h2>
          <p>
            Your use of WeCam is also governed by our <Link to="/privacy">Privacy Policy</Link>. Video and
            audio streams are transmitted peer-to-peer and are not recorded or stored by WeCam.
          </p>
        </section>

        <section>
          <h2>Disclaimer of Warranties</h2>
          <p>
            WeCam is provided "as is" without warranties of any kind, either express or implied. We do not
            guarantee that the service will be uninterrupted, secure, or error-free. We are not responsible
            for the content or behavior of other users.
          </p>
        </section>

        <section>
          <h2>Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, WeCam shall not be liable for any indirect, incidental,
            special, or consequential damages arising from your use of the service.
          </p>
        </section>

        <section>
          <h2>Termination</h2>
          <p>
            We reserve the right to restrict or terminate access to WeCam for any user who violates these
            terms, without prior notice.
          </p>
        </section>

        <section>
          <h2>Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of WeCam after changes constitutes
            acceptance of the updated terms.
          </p>
        </section>

        <nav className="content-links" aria-label="Related pages">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/about">About WeCam</Link>
          <Link to="/faq">FAQ</Link>
        </nav>
      </article>
    </main>
  );
}
