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

    try {
      // Get new video stream with opposite facing mode (video only)
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: newFacingMode } },
        audio: false
      });

      const newVideoTrack = newVideoStream.getVideoTracks()[0];

      // If we have an active peer connection, replace the video track
      if (peerConnection.current) {
        const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }

      // Stop old video track after new one is ready
      const oldVideoTrack = localStream.getVideoTracks()[0];
      if (oldVideoTrack) {
        oldVideoTrack.stop();
      }

      // Create a new MediaStream with the new video track and existing audio track
      const existingAudioTrack = localStream.getAudioTracks()[0];
      const newStream = new MediaStream();
      newStream.addTrack(newVideoTrack);
      if (existingAudioTrack) {
        newStream.addTrack(existingAudioTrack);
      }

      setLocalStream(newStream);
      setFacingMode(newFacingMode);

      return newStream;
    } catch (err) {
      // If exact facingMode fails, try without exact constraint
      console.warn('Exact facingMode failed, trying ideal:', err);
      try {
        const newVideoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: newFacingMode } },
          audio: false
        });

        const newVideoTrack = newVideoStream.getVideoTracks()[0];

        if (peerConnection.current) {
          const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(newVideoTrack);
          }
        }

        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          oldVideoTrack.stop();
        }

        const existingAudioTrack = localStream.getAudioTracks()[0];
        const newStream = new MediaStream();
        newStream.addTrack(newVideoTrack);
        if (existingAudioTrack) {
          newStream.addTrack(existingAudioTrack);
        }

        setLocalStream(newStream);
        setFacingMode(newFacingMode);

        return newStream;
      } catch (fallbackErr) {
        console.error('Failed to switch camera:', fallbackErr);
        throw fallbackErr;
      }
    }
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
