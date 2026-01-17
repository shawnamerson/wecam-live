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
  const [availableCameras, setAvailableCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

  const peerConnection = useRef(null);
  const partnerId = useRef(null);
  const streamRef = useRef(null);

  // Get user media with optional specific camera
  const getUserMediaWithCamera = useCallback(async (deviceId) => {
    const constraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: true
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Enumerate cameras after getting permission
    const devices = await navigator.mediaDevices.enumerateDevices();
    let cameras = devices.filter(device =>
      device.kind === 'videoinput' && device.label && device.label.trim() !== ''
    );

    // On iOS, simplify to just front/back (iPhone exposes multiple rear cameras)
    const hasFrontLabel = cameras.some(c =>
      c.label.toLowerCase().includes('front') ||
      c.label.toLowerCase().includes('user')
    );
    const hasBackLabel = cameras.some(c =>
      c.label.toLowerCase().includes('back') ||
      c.label.toLowerCase().includes('rear') ||
      c.label.toLowerCase().includes('environment')
    );

    // If we have both front and back cameras, filter to just one of each
    if (cameras.length > 2 && hasFrontLabel && hasBackLabel) {
      const front = cameras.find(c =>
        c.label.toLowerCase().includes('front') ||
        c.label.toLowerCase().includes('user')
      );
      const back = cameras.find(c =>
        (c.label.toLowerCase().includes('back') ||
         c.label.toLowerCase().includes('rear') ||
         c.label.toLowerCase().includes('environment')) &&
        !c.label.toLowerCase().includes('ultra') &&
        !c.label.toLowerCase().includes('telephoto')
      ) || cameras.find(c =>
        c.label.toLowerCase().includes('back') ||
        c.label.toLowerCase().includes('rear') ||
        c.label.toLowerCase().includes('environment')
      );

      if (front && back) {
        cameras = [front, back];
      }
    }

    console.log('Available cameras:', cameras.map(c => ({ id: c.deviceId, label: c.label })));
    setAvailableCameras(cameras);

    return stream;
  }, []);

  // Get user media (camera + mic)
  const startLocalStream = useCallback(async () => {
    try {
      const stream = await getUserMediaWithCamera();
      streamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get local stream:', err);
      throw err;
    }
  }, [getUserMediaWithCamera]);

  // Stop local stream
  const stopLocalStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setLocalStream(null);
  }, []);

  // Switch between front and rear camera
  const switchCamera = useCallback(async () => {
    if (availableCameras.length <= 1) {
      console.log('Only one camera available, cannot switch');
      return;
    }

    try {
      // Stop all tracks in current stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Get next camera using index
      const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
      setCurrentCameraIndex(nextIndex);
      const nextCamera = availableCameras[nextIndex];

      console.log('Switching to camera:', nextCamera.label || nextCamera.deviceId);

      // Get completely fresh stream with selected camera
      const stream = await getUserMediaWithCamera(nextCamera.deviceId);
      streamRef.current = stream;

      // Update peer connection if we're in a call
      if (peerConnection.current) {
        const videoSender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video');
        const newVideoTrack = stream.getVideoTracks()[0];
        if (videoSender && newVideoTrack) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      }

      setLocalStream(stream);
      return stream;

    } catch (err) {
      console.error('Switch camera failed:', err);
      return null;
    }
  }, [availableCameras, currentCameraIndex, getUserMediaWithCamera]);

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
    availableCameras,
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
