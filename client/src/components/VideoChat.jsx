import { useEffect, useRef } from 'react';

export function VideoChat({ localStream, remoteStream, status, userCount, controls }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="video-layout">
      {/* Remote video panel */}
      <div className="video-panel remote-panel">
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
      </div>

      {/* Local video panel */}
      <div className="video-panel local-panel">
        <div className="video-wrapper">
          {localStream ? (
            <video
              ref={localVideoRef}
              className="video-element"
              autoPlay
              playsInline
              muted
            />
          ) : (
            <div className="video-placeholder">
              <span className="status-text">Your camera</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
