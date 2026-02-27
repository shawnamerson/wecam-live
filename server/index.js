import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import matchmaker from './matchmaker.js';
import { authenticateSocket, verifyToken } from './auth.js';
import { TOKEN_PACKAGES, createPaymentIntent, handleWebhook, getTokenBalance, deductToken } from './stripe.js';

const AUTH_REQUIRED = process.env.AUTH_REQUIRED === 'true';

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

app.use(compression());
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));

// Stripe webhook — must use raw body, before express.json()
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const result = await handleWebhook(req.body, signature);
    res.json(result);
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// JSON parser for all other routes
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/create-payment-intent', paymentLimiter);

// Authenticate request via Authorization header (Bearer JWT)
async function authenticateRequest(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  const user = await verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = user.id;
  next();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ...matchmaker.getStats() });
});

// Token packages (public)
app.get('/api/token-packages', (req, res) => {
  res.json(TOKEN_PACKAGES);
});

// Create payment intent (authenticated)
app.post('/api/create-payment-intent', authenticateRequest, async (req, res) => {
  try {
    const { packageId } = req.body;
    const result = await createPaymentIntent(packageId, req.userId);
    res.json(result);
  } catch (err) {
    console.error('PaymentIntent error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Get token balance (authenticated)
app.get('/api/token-balance', authenticateRequest, async (req, res) => {
  try {
    const balance = await getTokenBalance(req.userId);
    res.json({ balance });
  } catch (err) {
    console.error('Balance error:', err.message);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// Helper: deduct token from a socket user if they have a gender filter active
async function deductTokenIfNeeded(socketId) {
  const meta = matchmaker.getUserMeta(socketId);
  if (!meta?.genderFilter || !meta?.userInfo?.id) return true; // no filter = free
  const success = await deductToken(meta.userInfo.id, { matchSocketId: socketId });
  return success;
}

// Broadcast user count to all clients
function broadcastUserCount() {
  const count = io.engine.clientsCount;
  io.emit('user-count', count);
}

io.on('connection', async (socket) => {
  // Authenticate user (returns userInfo or null for anonymous)
  const userInfo = await authenticateSocket(socket);
  const displayName = userInfo?.email || 'Anonymous';
  console.log(`User connected: ${socket.id} (${displayName})`);

  // If auth is required and user is not authenticated, disconnect
  if (AUTH_REQUIRED && !userInfo) {
    socket.emit('auth-error', { message: 'Authentication required' });
    socket.disconnect(true);
    return;
  }

  // Send current user count to all clients
  broadcastUserCount();

  // User wants to find a partner
  socket.on('join', async (options) => {
    const rawFilter = options?.genderFilter;
    const genderFilter = (rawFilter === 'male' || rawFilter === 'female') ? rawFilter : null;

    // Validate: gender filter requires auth
    if (genderFilter && !userInfo) {
      socket.emit('filter-error', { message: 'Login required to use gender filter' });
      return;
    }

    console.log(`User ${socket.id} joining queue${genderFilter ? ` (filter: ${genderFilter})` : ''}`);
    const partnerId = matchmaker.findMatch(socket.id, userInfo, genderFilter);

    if (partnerId) {
      // Check if either user needs token deduction
      const myDeducted = await deductTokenIfNeeded(socket.id);
      const partnerDeducted = await deductTokenIfNeeded(partnerId);

      if (!myDeducted) {
        // Undo match, re-queue partner
        matchmaker.breakPair(socket.id);
        const partnerMeta = matchmaker.getUserMeta(partnerId);
        matchmaker.addToQueue(partnerId, partnerMeta?.userInfo, partnerMeta?.genderFilter);
        socket.emit('insufficient-tokens');
        return;
      }

      if (!partnerDeducted) {
        // Undo match, re-queue me
        matchmaker.breakPair(socket.id);
        matchmaker.addToQueue(socket.id, userInfo, genderFilter);
        io.to(partnerId).emit('insufficient-tokens');
        socket.emit('waiting');
        return;
      }

      console.log(`Matched: ${socket.id} <-> ${partnerId}`);
      // Notify both users they're matched
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
  socket.on('next', async (options) => {
    const rawFilter = options?.genderFilter;
    const genderFilter = (rawFilter === 'male' || rawFilter === 'female') ? rawFilter : null;

    if (genderFilter && !userInfo) {
      socket.emit('filter-error', { message: 'Login required to use gender filter' });
      return;
    }

    console.log(`User ${socket.id} wants next partner`);
    const oldPartnerId = matchmaker.removeUser(socket.id);

    if (oldPartnerId) {
      // Notify old partner they were skipped
      io.to(oldPartnerId).emit('partner-left');
    }

    // Try to find new match
    const newPartnerId = matchmaker.findMatch(socket.id, userInfo, genderFilter);

    if (newPartnerId) {
      const myDeducted = await deductTokenIfNeeded(socket.id);
      const partnerDeducted = await deductTokenIfNeeded(newPartnerId);

      if (!myDeducted) {
        matchmaker.breakPair(socket.id);
        const partnerMeta = matchmaker.getUserMeta(newPartnerId);
        matchmaker.addToQueue(newPartnerId, partnerMeta?.userInfo, partnerMeta?.genderFilter);
        socket.emit('insufficient-tokens');
        return;
      }

      if (!partnerDeducted) {
        matchmaker.breakPair(socket.id);
        matchmaker.addToQueue(socket.id, userInfo, genderFilter);
        io.to(newPartnerId).emit('insufficient-tokens');
        socket.emit('waiting');
        return;
      }

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
