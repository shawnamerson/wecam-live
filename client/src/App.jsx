import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { Layout } from './components/Layout';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const BlogIndex = lazy(() => import('./pages/blog/BlogIndex'));
const OmegleAlternatives = lazy(() => import('./pages/blog/OmegleAlternatives'));
const VideoSafety = lazy(() => import('./pages/blog/VideoSafety'));
const WhatHappenedToOmegle = lazy(() => import('./pages/blog/WhatHappenedToOmegle'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <>
      <Suspense fallback={<div className="app"><div className="page-loading">Loading...</div></div>}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/blog/best-omegle-alternatives-2026" element={<OmegleAlternatives />} />
            <Route path="/blog/video-chat-safety-tips" element={<VideoSafety />} />
            <Route path="/blog/what-happened-to-omegle" element={<WhatHappenedToOmegle />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
      <Analytics />
    </>
  );
}

export default App;
