import { useEffect, useRef } from 'react';

export function VideoChat({ localStream, remoteStream, status }) {
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
    <div className="video-container">
      {/* Remote video (large) */}
      <div className="remote-video-wrapper">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            className="remote-video"
            autoPlay
            playsInline
          />
        ) : (
          <div className="video-placeholder">
            <span className="status-text">{status}</span>
          </div>
        )}
      </div>

      {/* Local video (small, corner) */}
      {localStream && (
        <video
          ref={localVideoRef}
          className="local-video"
          autoPlay
          playsInline
          muted
        />
      )}
    </div>
  );
}
