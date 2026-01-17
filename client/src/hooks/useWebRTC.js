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

    const oldVideoTrack = localStream.getVideoTracks()[0];
    const audioTrack = localStream.getAudioTracks()[0];

    // Get current device ID
    const currentDeviceId = oldVideoTrack?.getSettings()?.deviceId;

    // Stop old video track first (required on iOS)
    if (oldVideoTrack) {
      oldVideoTrack.stop();
    }

    try {
      // Get list of all video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');

      console.log('Available cameras:', videoDevices.length);

      let newVideoTrack = null;

      if (videoDevices.length > 1) {
        // Find a different camera than the current one
        const otherCamera = videoDevices.find(d => d.deviceId !== currentDeviceId);

        if (otherCamera) {
          console.log('Switching to device:', otherCamera.label || otherCamera.deviceId);
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: otherCamera.deviceId } },
            audio: false
          });
          newVideoTrack = stream.getVideoTracks()[0];
        }
      }

      // Fallback: just get any video if device switch failed
      if (!newVideoTrack) {
        console.log('Fallback: requesting any camera');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        newVideoTrack = stream.getVideoTracks()[0];
      }

      // Build new stream with new video + existing audio
      const newStream = new MediaStream();
      newStream.addTrack(newVideoTrack);
      if (audioTrack) {
        newStream.addTrack(audioTrack);
      }

      // Replace video track in peer connection if connected
      if (peerConnection.current) {
        const videoSender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      }

      // Update facing mode based on new track settings
      const newSettings = newVideoTrack.getSettings();
      if (newSettings.facingMode) {
        setFacingMode(newSettings.facingMode);
      }

      setLocalStream(newStream);
      return newStream;

    } catch (err) {
      console.error('Switch camera failed:', err);

      // Try to restore any camera
      try {
        const restored = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        const restoredTrack = restored.getVideoTracks()[0];

        const newStream = new MediaStream();
        newStream.addTrack(restoredTrack);
        if (audioTrack) {
          newStream.addTrack(audioTrack);
        }

        setLocalStream(newStream);
        return newStream;
      } catch (e) {
        console.error('Could not restore camera:', e);
        return null;
      }
    }
  }, [localStream]);

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
