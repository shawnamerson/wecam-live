import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Analytics } from '@vercel/analytics/react';
import { useWebRTC } from './hooks/useWebRTC';
import { VideoChat } from './components/VideoChat';
import { Controls } from './components/Controls';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [status, setStatus] = useState('Click Start to begin');
  const [userCount, setUserCount] = useState(0);

  const {
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

    newSocket.on('user-count', (count) => {
      setUserCount(count);
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
      if (initiator) {
        await createOffer(partnerId);
      }
    });

    // Received offer
    socket.on('offer', async ({ offer, from }) => {
      await handleOffer(offer, from);
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
      await startLocalStream();
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
    setIsStarted(false);
    setStatus('Click Start to begin');
  }, [socket, closePeerConnection, stopLocalStream]);

  // Handle camera switch
  const handleSwitchCamera = useCallback(async () => {
    try {
      await switchCamera();
    } catch (err) {
      console.error('Failed to switch camera:', err);
    }
  }, [switchCamera]);

  return (
    <div className="app">
      <header className="site-header">
        <h1>WeCam - Free Random Video Chat</h1>
        {!isStarted && (
          <p className="site-description">
            Meet strangers worldwide with free random video chat. No signup, no downloads — just click Start and connect instantly. The best Omegle alternative for anonymous video conversations.
          </p>
        )}
      </header>
      <main className="main">
        <VideoChat
          localStream={localStream}
          remoteStream={remoteStream}
          status={status}
          userCount={userCount}
          onSwitchCamera={handleSwitchCamera}
          canSwitchCamera={availableCameras.length > 1}
          controls={
            <Controls
              isStarted={isStarted}
              isConnected={connectionState === 'connected'}
              onStart={handleStart}
              onNext={handleNext}
              onStop={handleStop}
            />
          }
        />
      </main>
      <footer className="site-footer">
        <nav aria-label="Footer navigation">
          <span className="footer-brand">WeCam</span>
          <span className="footer-sep">—</span>
          <span>Free Omegle alternative for random video chat</span>
        </nav>
      </footer>
      <Analytics />
    </div>
  );
}

export default App;
