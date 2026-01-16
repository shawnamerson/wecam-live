import { useState, useRef, useCallback, useEffect } from 'react';

// ICE servers config - STUN for most users, TURN for users behind strict NATs
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
};

export function useWebRTC(socket) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState('idle'); // idle, connecting, connected
  const [facingMode, setFacingMode] = useState('user'); // 'user' = front, 'environment' = rear

  const peerConnection = useRef(null);
  const partnerId = useRef(null);

  // Get user media (camera + mic)
  const startLocalStream = useCallback(async (preferredFacingMode = 'user') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: preferredFacingMode },
        audio: true
      });
      setLocalStream(stream);
      setFacingMode(preferredFacingMode);
      return stream;
    } catch (err) {
      console.error('Failed to get local stream:', err);
      throw err;
    }
  }, []);

  // Stop local stream
  const stopLocalStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  }, [localStream]);

  // Switch between front and rear camera
  const switchCamera = useCallback(async () => {
    if (!localStream) return;

    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';

    // Try to get new stream FIRST, before stopping old one
    const constraints = [
      { video: { facingMode: { exact: newFacingMode } }, audio: true },
      { video: { facingMode: newFacingMode }, audio: true },
      { video: { facingMode: { ideal: newFacingMode } }, audio: true },
      { video: true, audio: true } // Last resort: any camera
    ];

    let newStream = null;

    for (const constraint of constraints) {
      try {
        newStream = await navigator.mediaDevices.getUserMedia(constraint);
        console.log('Got stream with constraint:', constraint);
        break;
      } catch (err) {
        console.warn('Constraint failed:', constraint, err.message);
      }
    }

    if (!newStream) {
      // Complete failure - keep existing stream
      console.error('Failed to switch camera, keeping current stream');
      return localStream;
    }

    // Success! Now stop old tracks
    localStream.getTracks().forEach(track => track.stop());

    // Replace tracks in peer connection if connected
    if (peerConnection.current) {
      const senders = peerConnection.current.getSenders();

      const videoSender = senders.find(s => s.track?.kind === 'video');
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (videoSender && newVideoTrack) {
        await videoSender.replaceTrack(newVideoTrack);
      }

      const audioSender = senders.find(s => s.track?.kind === 'audio');
      const newAudioTrack = newStream.getAudioTracks()[0];
      if (audioSender && newAudioTrack) {
        await audioSender.replaceTrack(newAudioTrack);
      }
    }

    setLocalStream(newStream);
    setFacingMode(newFacingMode);

    return newStream;
  }, [localStream, facingMode]);

  // Create new peer connection
  const createPeerConnection = useCallback((stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('Received remote track');
      setRemoteStream(event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && partnerId.current) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: partnerId.current
        });
      }
    };

    // Monitor connection state
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setConnectionState('connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setConnectionState('idle');
      }
    };

    peerConnection.current = pc;
    return pc;
  }, [socket]);

  // Create and send offer
  const createOffer = useCallback(async (stream, targetId) => {
    partnerId.current = targetId;
    setConnectionState('connecting');

    const pc = createPeerConnection(stream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('offer', { offer, to: targetId });
  }, [socket, createPeerConnection]);

  // Handle incoming offer and send answer
  const handleOffer = useCallback(async (offer, fromId, stream) => {
    partnerId.current = fromId;
    setConnectionState('connecting');

    const pc = createPeerConnection(stream);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('answer', { answer, to: fromId });
  }, [socket, createPeerConnection]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (answer) => {
    if (peerConnection.current) {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    }
  }, []);

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(async (candidate) => {
    if (peerConnection.current) {
      try {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    }
  }, []);

  // Close peer connection
  const closePeerConnection = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    partnerId.current = null;
    setRemoteStream(null);
    setConnectionState('idle');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closePeerConnection();
      stopLocalStream();
    };
  }, [closePeerConnection, stopLocalStream]);

  return {
    localStream,
    remoteStream,
    connectionState,
    facingMode,
    startLocalStream,
    stopLocalStream,
    switchCamera,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    closePeerConnection
  };
}
