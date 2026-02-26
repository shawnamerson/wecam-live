import { useEffect, useRef } from 'react';

export function VideoChat({ localStream, remoteStream, status, userCount, controls, onSwitchCamera, canSwitchCamera }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach local stream to video element
  useEffect(() => {
    const video = localVideoRef.current;
    if (video && localStream) {
      // iOS Safari fix: reset srcObject before setting new stream
      video.srcObject = null;
      video.load();
      video.srcObject = localStream;
      // iOS Safari needs explicit play() after changing srcObject
      video.play().catch(() => {});
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  return (
    <div className="video-layout">
      {/* Remote video panel */}
      <section className="video-panel remote-panel" aria-labelledby="remote-video-heading">
        <h2 id="remote-video-heading" className="sr-only">Partner Video</h2>
        <div className="video-wrapper">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              className="video-element"
              autoPlay
              playsInline
            />
          ) : (
            <div className="video-placeholder">
              <span className="status-text">{status}</span>
            </div>
          )}
        </div>
        <div className="controls-wrapper">
          <div className="user-count">
            <span className="user-count-dot"></span>
            {userCount} online
          </div>
          {controls}
        </div>
      </section>

      {/* Local video panel */}
      <section className="video-panel local-panel" aria-labelledby="local-video-heading">
        <h2 id="local-video-heading" className="sr-only">Your Camera</h2>
        <div className="video-wrapper">
          {localStream ? (
            <>
              <video
                ref={localVideoRef}
                className="video-element"
                autoPlay
                playsInline
                muted
              />
              {canSwitchCamera && (
                <button
                  className="btn-switch-camera"
                  onClick={onSwitchCamera}
                  aria-label="Switch camera"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>
                    <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5"/>
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M18 22l-3-3 3-3"/>
                    <path d="M6 2l3 3-3 3"/>
                  </svg>
                </button>
              )}
            </>
          ) : (
            <div className="video-placeholder">
              <span className="status-text">Your camera</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
