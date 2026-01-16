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

    // Try different constraint styles for iOS compatibility
    const constraints = [
      { video: { facingMode: { exact: newFacingMode } }, audio: false },
      { video: { facingMode: newFacingMode }, audio: false },
      { video: { facingMode: { ideal: newFacingMode } }, audio: false }
    ];

    let newVideoTrack = null;

    for (const constraint of constraints) {
      try {
        const newVideoStream = await navigator.mediaDevices.getUserMedia(constraint);
        newVideoTrack = newVideoStream.getVideoTracks()[0];
        break;
      } catch (err) {
        console.warn('Constraint failed:', constraint, err);
      }
    }

    if (!newVideoTrack) {
      console.error('Failed to get new camera with any constraint');
      return;
    }

    // Get old video track
    const oldVideoTrack = localStream.getVideoTracks()[0];

    // Replace track in peer connection if connected
    if (peerConnection.current) {
      const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }
    }

    // Replace track in the existing MediaStream (keeps same reference for iOS)
    if (oldVideoTrack) {
      localStream.removeTrack(oldVideoTrack);
      oldVideoTrack.stop();
    }
    localStream.addTrack(newVideoTrack);

    // Force React to re-render by setting a new stream reference
    // but clone from the modified stream to keep tracks
    const updatedStream = new MediaStream(localStream.getTracks());
    setLocalStream(updatedStream);
    setFacingMode(newFacingMode);

    return updatedStream;
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
