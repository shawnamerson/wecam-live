/**
 * Prerender script — generates per-route HTML files after `vite build`.
 *
 * For each route, takes the built index.html and injects route-specific
 * meta tags (title, description, canonical, OG, Twitter) and static body
 * content so crawlers see unique, keyword-rich HTML per page without
 * needing to execute JavaScript.
 *
 * React hydrates on top of this shell when JS loads.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DIST = join(import.meta.dirname, 'dist');
const BASE_URL = 'https://wecam.live';
const SITE_NAME = 'WeCam';

// Route definitions with SEO metadata and static body content
const ROUTES = [
  {
    path: '/about',
    title: 'About WeCam - Free Omegle Alternative',
    description: 'WeCam is a free random video chat site where you can talk to strangers anonymously. No signup, no download — the best Omegle alternative and chat roulette platform.',
    body: `
      <header class="site-header"><h1>About WeCam - Talk to Strangers with Free Video Chat</h1></header>
      <main class="content-page"><article class="content-container">
        <p>WeCam is a free random video chat platform that lets you talk to strangers from around the world. Think of it as the modern successor to Omegle and a safe chat roulette alternative — simple, anonymous, and instant.</p>
        <h2>Why WeCam?</h2>
        <ul>
          <li>100% Free — No premium tiers, no hidden costs</li>
          <li>No Signup Required — Talk to strangers in seconds</li>
          <li>No Download Needed — Works in your browser</li>
          <li>Safe &amp; Anonymous — Peer-to-peer WebRTC connections</li>
          <li>Mobile Friendly — Camera switching on phones and tablets</li>
        </ul>
      </article></main>`,
  },
  {
    path: '/faq',
    title: 'FAQ - Random Video Chat Questions',
    description: 'Frequently asked questions about WeCam, the best free Omegle alternative. Learn how to talk to strangers safely, use gender filters, and get started with random video chat.',
    body: `
      <header class="site-header"><h1>Frequently Asked Questions About WeCam Video Chat</h1></header>
      <main class="content-page"><article class="content-container">
        <h2>What is WeCam?</h2>
        <p>WeCam is a free random video chat platform and the best Omegle alternative. Talk to strangers worldwide with anonymous video chat — no signup, no download required.</p>
        <h2>Is WeCam free?</h2>
        <p>Yes, WeCam is completely free with no hidden fees or subscriptions.</p>
        <h2>What happened to Omegle?</h2>
        <p>Omegle shut down in November 2023. WeCam is the best Omegle replacement with the same random video chat experience.</p>
      </article></main>`,
  },
  {
    path: '/privacy',
    title: 'Privacy Policy',
    description: 'WeCam privacy policy. Learn how we keep your anonymous video chat safe with peer-to-peer connections — no accounts, no data collection, no tracking.',
    body: `
      <header class="site-header"><h1>Privacy Policy</h1></header>
      <main class="content-page"><article class="content-container">
        <p>WeCam is built with privacy at its core. We use peer-to-peer WebRTC technology, which means your video and audio streams flow directly between you and your chat partner.</p>
      </article></main>`,
  },
  {
    path: '/terms',
    title: 'Terms of Service',
    description: 'WeCam terms of service. Rules and guidelines for using our free Omegle alternative and random video chat platform to talk to strangers.',
    body: `
      <header class="site-header"><h1>Terms of Service</h1></header>
      <main class="content-page"><article class="content-container">
        <p>By accessing and using WeCam (wecam.live), you agree to be bound by these Terms of Service. WeCam is a free random video chat platform for users aged 18 and older.</p>
      </article></main>`,
  },
  {
    path: '/blog',
    title: 'Blog - Video Chat Tips & Omegle Alternatives',
    description: 'WeCam blog — articles about random video chat, sites like Omegle, online safety tips for talking to strangers, and the future of anonymous video chat.',
    body: `
      <header class="site-header"><h1>WeCam Blog</h1></header>
      <main class="content-page"><div class="content-container">
        <p>Thoughts on random video chat, Omegle alternatives, chat roulette, and online safety for talking to strangers.</p>
        <h2><a href="/blog/best-omegle-alternatives-2026">Best Omegle Alternatives in 2026</a></h2>
        <p>Compare the top sites like Omegle and chat roulette alternatives available in 2026 to talk to strangers for free.</p>
        <h2><a href="/blog/video-chat-safety-tips">Video Chat Safety Tips for Talking to Strangers</a></h2>
        <p>Learn practical tips to protect your privacy on Omegle alternatives and chat roulette sites.</p>
        <h2><a href="/blog/what-happened-to-omegle">What Happened to Omegle?</a></h2>
        <p>After 14 years of letting people talk to strangers, Omegle shut down in November 2023.</p>
      </div></main>`,
  },
  {
    path: '/blog/best-omegle-alternatives-2026',
    title: 'Best Omegle Alternatives 2026 - Sites Like Omegle',
    description: 'Looking for sites like Omegle in 2026? Compare the best free Omegle alternatives for random video chat — WeCam, Chatroulette, OmeTV, and more chat roulette platforms to talk to strangers.',
    body: `
      <header class="site-header"><h1>Best Omegle Alternatives in 2026: Sites Like Omegle to Talk to Strangers</h1></header>
      <main class="content-page"><article class="content-container">
        <p>When Omegle shut down in November 2023, millions of users started searching for sites like Omegle and chat roulette alternatives. Here are the best free Omegle alternatives in 2026.</p>
        <h2>1. WeCam — Best Overall Omegle Alternative</h2>
        <p>WeCam is a free random video chat platform. No signup, no download — talk to strangers instantly with safe anonymous video chat.</p>
        <h2>2. Chatroulette</h2><p>One of the original random video chat platforms from 2009.</p>
        <h2>3. OmeTV</h2><p>A moderated alternative with mobile app support.</p>
        <h2>4. Emerald Chat</h2><p>Focused on meaningful conversations with interest matching.</p>
        <h2>5. Tinychat</h2><p>Group video chat rooms organized by topic.</p>
      </article></main>`,
  },
  {
    path: '/blog/video-chat-safety-tips',
    title: 'Video Chat Safety Tips for Talking to Strangers',
    description: 'Essential safety tips for random video chat and talking to strangers online. Learn how to protect your privacy on Omegle alternatives, chat roulette sites, and platforms like WeCam.',
    body: `
      <header class="site-header"><h1>How to Stay Safe Talking to Strangers on Random Video Chat</h1></header>
      <main class="content-page"><article class="content-container">
        <p>Random video chat platforms like WeCam offer a unique way to meet people. Here are essential safety tips for talking to strangers online.</p>
        <h2>1. Protect Your Personal Information</h2>
        <p>Never share your full name, address, phone number, or social media with strangers on video chat.</p>
        <h2>2. Use a Secure Platform</h2>
        <p>Choose platforms that use WebRTC for peer-to-peer connections, like WeCam, where video never passes through servers.</p>
        <h2>3. Trust Your Instincts</h2>
        <p>If a conversation feels uncomfortable, click Next to move on instantly.</p>
      </article></main>`,
  },
  {
    path: '/blog/video-chat-without-signing-up',
    title: 'Video Chat Without Signing Up - Free & Anonymous',
    description: 'Discover the best free video chat platforms that require no signup, no registration, and no account. Start anonymous video chat instantly with strangers on WeCam.',
    body: `
      <header class="site-header"><h1>Video Chat Without Signing Up: The Best Free Options</h1></header>
      <main class="content-page"><article class="content-container">
        <p>Looking for video chat with no signup required? Many people want to talk to strangers online without creating an account. Here are the best platforms for anonymous video chat with no registration.</p>
        <h2>Why No-Signup Video Chat Matters</h2>
        <p>Privacy, speed, and convenience. No email, no password, no personal data at risk.</p>
        <h2>Best No-Signup Video Chat Platforms</h2>
        <p>WeCam is the top choice — free, anonymous, no download or signup. Just click Start and talk to strangers instantly via WebRTC peer-to-peer connections.</p>
      </article></main>`,
  },
  {
    path: '/blog/is-random-video-chat-safe',
    title: 'Is Random Video Chat Safe? What You Need to Know',
    description: 'Is random video chat safe? Learn about the real risks of talking to strangers online, how to protect yourself, and what makes platforms like WeCam safer.',
    body: `
      <header class="site-header"><h1>Is Random Video Chat Safe? A Complete Guide</h1></header>
      <main class="content-page"><article class="content-container">
        <p>Is random video chat safe? The short answer: it can be, if you use the right platform and follow basic precautions. Here's what you need to know about safe video chat with strangers.</p>
        <h2>The Real Risks</h2>
        <p>Privacy exposure, inappropriate content, scams, and data collection are the main concerns.</p>
        <h2>What Makes a Platform Safe</h2>
        <p>Peer-to-peer WebRTC connections, no data collection, no signup required, and an instant skip button. WeCam is built with all of these safety features.</p>
      </article></main>`,
  },
  {
    path: '/blog/how-to-meet-people-online-for-free',
    title: 'How to Meet People Online for Free in 2026',
    description: 'The best ways to meet people online for free in 2026. From random video chat to social apps and forums, discover how to talk to strangers and make new connections.',
    body: `
      <header class="site-header"><h1>How to Meet People Online for Free: Best Ways in 2026</h1></header>
      <main class="content-page"><article class="content-container">
        <p>Want to meet new people online without spending money? From random video chat to forums and social apps, here are the best free ways to connect with strangers in 2026.</p>
        <h2>Random Video Chat</h2>
        <p>The most direct way to meet strangers online. Platforms like WeCam connect you face-to-face instantly — no signup, no fees.</p>
        <h2>Why Video Chat Beats Text</h2>
        <p>Face-to-face conversations build real connections faster than text-based alternatives.</p>
      </article></main>`,
  },
  {
    path: '/blog/omegle-shut-down-what-to-use',
    title: 'Omegle Shut Down — What to Use Instead in 2026',
    description: 'Omegle shut down in November 2023. Here are the best Omegle replacements for free random video chat with strangers in 2026.',
    body: `
      <header class="site-header"><h1>Omegle Shut Down: What to Use Now for Random Video Chat</h1></header>
      <main class="content-page"><article class="content-container">
        <p>Omegle shut down in November 2023 and is not coming back. If you're looking for an Omegle replacement, here are the best alternatives for random video chat with strangers in 2026.</p>
        <h2>Best Omegle Replacement: WeCam</h2>
        <p>WeCam offers the closest experience to original Omegle — free, anonymous, no signup required. Just click Start and talk to strangers instantly.</p>
      </article></main>`,
  },
  {
    path: '/blog/chat-roulette-vs-omegle-alternatives',
    title: 'Chat Roulette vs Omegle Alternatives Compared',
    description: 'Chat Roulette vs Omegle — how do these random video chat concepts compare in 2026? Features, history, and modern alternatives compared.',
    body: `
      <header class="site-header"><h1>Chat Roulette vs Omegle Alternatives: Which Is Best?</h1></header>
      <main class="content-page"><article class="content-container">
        <p>Chat Roulette and Omegle both pioneered random video chat with strangers. How do they compare, and what are the best alternatives in 2026?</p>
        <h2>The History</h2>
        <p>Omegle launched in 2009 for text chat, adding video in 2010. Chatroulette launched in 2009 with video-first roulette-style matching.</p>
        <h2>Best Modern Alternative: WeCam</h2>
        <p>WeCam combines the best of both — free random video chat with instant matching, no signup, and features like gender filters and mobile camera switching.</p>
      </article></main>`,
  },
  {
    path: '/blog/what-happened-to-omegle',
    title: 'What Happened to Omegle? Why It Shut Down',
    description: 'The full story of why Omegle shut down in November 2023. Learn what happened, why it closed, and where to talk to strangers now — the best Omegle alternatives and sites like Omegle in 2026.',
    body: `
      <header class="site-header"><h1>What Happened to Omegle? Why It Shut Down &amp; Where to Chat Now</h1></header>
      <main class="content-page"><article class="content-container">
        <p>Omegle, the pioneering random video chat platform, permanently shut down on November 8, 2023 after 14 years of connecting strangers worldwide.</p>
        <h2>The Rise of Omegle</h2>
        <p>Created by Leif K-Brooks in 2009, Omegle was the go-to platform for talking to strangers via random video chat.</p>
        <h2>Where Did Omegle Users Go?</h2>
        <p>Former users moved to alternatives like WeCam, Chatroulette, OmeTV, and Emerald Chat. WeCam offers the closest experience to original Omegle — free, anonymous, no signup required.</p>
      </article></main>`,
  },
];

// Read the built index.html
const template = readFileSync(join(DIST, 'index.html'), 'utf-8');

function generateHTML(route) {
  const fullTitle = `${route.title} | ${SITE_NAME}`;
  const canonicalUrl = `${BASE_URL}${route.path}`;
  const ogImage = `${BASE_URL}/og-image.png`;

  let html = template;

  // Replace title
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${fullTitle}</title>`
  );

  // Replace meta description
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${route.description}" />`
  );

  // Replace canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );

  // Replace OG tags
  html = html.replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${fullTitle}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${route.description}" />`
  );

  // Replace Twitter tags
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${fullTitle}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${route.description}" />`
  );

  // Replace the static body content inside #root
  // The static fallback is between <!-- Static fallback --> and the closing </div> of #root
  const rootStart = html.indexOf('<div id="root">');
  const rootEnd = html.indexOf('</div>\n    </div>\n    <noscript>');
  if (rootStart !== -1 && rootEnd !== -1) {
    const nav = `<div class="app">
      <nav class="site-nav" aria-label="Main navigation">
        <div class="nav-inner">
          <a href="/" class="nav-brand">WeCam</a>
          <div class="nav-links">
            <a href="/about">About</a>
            <a href="/faq">FAQ</a>
            <a href="/blog">Blog</a>
          </div>
        </div>
      </nav>
      ${route.body}
      <footer class="site-footer">
        <nav aria-label="Footer navigation">
          <div class="footer-links">
            <a href="/about">About</a>
            <a href="/faq">FAQ</a>
            <a href="/blog">Blog</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
          <p class="footer-copy">&copy; 2026 WeCam &mdash; Talk to strangers with free random video chat.</p>
        </nav>
      </footer>`;

    html = html.substring(0, rootStart) +
      `<div id="root">\n      ${nav}\n    ` +
      html.substring(rootEnd);
  }

  // Remove the noscript H1 to avoid duplicate H1 tags
  html = html.replace(
    /<noscript>[\s\S]*?<\/noscript>/,
    '<noscript><p>Please enable JavaScript to use WeCam.</p></noscript>'
  );

  return html;
}

console.log(`Prerendering ${ROUTES.length} routes...\n`);

for (const route of ROUTES) {
  const html = generateHTML(route);

  const outDir = join(DIST, route.path);
  mkdirSync(outDir, { recursive: true });

  const outPath = join(outDir, 'index.html');
  writeFileSync(outPath, html);
  console.log(`  ✓ ${route.path}`);
}

console.log('\nPrerendering complete!');
