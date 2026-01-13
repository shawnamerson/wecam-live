import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useWebRTC } from './hooks/useWebRTC';
import { VideoChat } from './components/VideoChat';
import { Controls } from './components/Controls';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [status, setStatus] = useState('Click Start to begin');

  const localStreamRef = useRef(null);

  const {
    localStream,
    remoteStream,
    connectionState,
    startLocalStream,
    stopLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    closePeerConnection
  } = useWebRTC(socket);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SERVER_URL);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Waiting for partner
    socket.on('waiting', () => {
      setStatus('Waiting for a partner...');
    });

    // Matched with partner
    socket.on('matched', async ({ partnerId, initiator }) => {
      setStatus('Connected! Say hi!');
      if (initiator && localStreamRef.current) {
        await createOffer(localStreamRef.current, partnerId);
      }
    });

    // Received offer
    socket.on('offer', async ({ offer, from }) => {
      if (localStreamRef.current) {
        await handleOffer(offer, from, localStreamRef.current);
      }
    });

    // Received answer
    socket.on('answer', async ({ answer }) => {
      await handleAnswer(answer);
    });

    // Received ICE candidate
    socket.on('ice-candidate', async ({ candidate }) => {
      await handleIceCandidate(candidate);
    });

    // Partner left
    socket.on('partner-left', () => {
      setStatus('Partner disconnected. Finding new partner...');
      closePeerConnection();
      socket.emit('join');
    });

    return () => {
      socket.off('waiting');
      socket.off('matched');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('partner-left');
    };
  }, [socket, createOffer, handleOffer, handleAnswer, handleIceCandidate, closePeerConnection]);

  // Handle Start button
  const handleStart = useCallback(async () => {
    try {
      const stream = await startLocalStream();
      localStreamRef.current = stream;
      setIsStarted(true);
      setStatus('Waiting for a partner...');
      socket?.emit('join');
    } catch (err) {
      setStatus('Camera access denied. Please allow camera access.');
    }
  }, [socket, startLocalStream]);

  // Handle Next button
  const handleNext = useCallback(() => {
    closePeerConnection();
    setStatus('Finding new partner...');
    socket?.emit('next');
  }, [socket, closePeerConnection]);

  // Handle Stop button
  const handleStop = useCallback(() => {
    socket?.emit('stop');
    closePeerConnection();
    stopLocalStream();
    localStreamRef.current = null;
    setIsStarted(false);
    setStatus('Click Start to begin');
  }, [socket, closePeerConnection, stopLocalStream]);

  return (
    <div className="app">
      <header className="header">
        <h1>WeCam</h1>
      </header>

      <main className="main">
        <VideoChat
          localStream={localStream}
          remoteStream={remoteStream}
          status={status}
        />

        <Controls
          isStarted={isStarted}
          isConnected={connectionState === 'connected'}
          onStart={handleStart}
          onNext={handleNext}
          onStop={handleStop}
        />
      </main>
    </div>
  );
}

export default App;
