import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import matchmaker from './matchmaker.js';

const app = express();
const server = createServer(app);

// Configure allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

// Add production client URL if configured (supports both www and non-www)
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
  // Also allow www/non-www variant
  if (process.env.CLIENT_URL.includes('://www.')) {
    allowedOrigins.push(process.env.CLIENT_URL.replace('://www.', '://'));
  } else {
    allowedOrigins.push(process.env.CLIENT_URL.replace('://', '://www.'));
  }
}

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: allowedOrigins }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ...matchmaker.getStats() });
});

// Broadcast user count to all clients
function broadcastUserCount() {
  const count = io.engine.clientsCount;
  io.emit('user-count', count);
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send current user count to all clients
  broadcastUserCount();

  // User wants to find a partner
  socket.on('join', () => {
    console.log(`User ${socket.id} joining queue`);
    const partnerId = matchmaker.findMatch(socket.id);

    if (partnerId) {
      console.log(`Matched: ${socket.id} <-> ${partnerId}`);
      // Notify both users they're matched
      // The initiator (first user who was waiting) creates the offer
      socket.emit('matched', { partnerId, initiator: true });
      io.to(partnerId).emit('matched', { partnerId: socket.id, initiator: false });
    } else {
      socket.emit('waiting');
      console.log(`User ${socket.id} waiting for partner`);
    }
  });

  // WebRTC signaling: offer
  socket.on('offer', ({ offer, to }) => {
    console.log(`Offer from ${socket.id} to ${to}`);
    io.to(to).emit('offer', { offer, from: socket.id });
  });

  // WebRTC signaling: answer
  socket.on('answer', ({ answer, to }) => {
    console.log(`Answer from ${socket.id} to ${to}`);
    io.to(to).emit('answer', { answer, from: socket.id });
  });

  // WebRTC signaling: ICE candidate
  socket.on('ice-candidate', ({ candidate, to }) => {
    io.to(to).emit('ice-candidate', { candidate, from: socket.id });
  });

  // User wants to skip to next partner
  socket.on('next', () => {
    console.log(`User ${socket.id} wants next partner`);
    const oldPartnerId = matchmaker.removeUser(socket.id);

    if (oldPartnerId) {
      // Notify old partner they were skipped
      io.to(oldPartnerId).emit('partner-left');
    }

    // Try to find new match
    const newPartnerId = matchmaker.findMatch(socket.id);

    if (newPartnerId) {
      console.log(`New match: ${socket.id} <-> ${newPartnerId}`);
      socket.emit('matched', { partnerId: newPartnerId, initiator: true });
      io.to(newPartnerId).emit('matched', { partnerId: socket.id, initiator: false });
    } else {
      socket.emit('waiting');
    }
  });

  // User stops/leaves
  socket.on('stop', () => {
    console.log(`User ${socket.id} stopped`);
    const partnerId = matchmaker.removeUser(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partner-left');
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const partnerId = matchmaker.removeUser(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partner-left');
    }
    // Update user count for remaining clients
    broadcastUserCount();
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
