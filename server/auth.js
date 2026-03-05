import { supabase } from './supabase.js';
import { log } from './logger.js';

/**
 * Verify a JWT token via Supabase and return the user ID, or null on failure.
 */
export async function verifyToken(token) {
  if (!token || !supabase) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/**
 * Authenticate a socket connection using the JWT from handshake auth.
 * Returns { id, email, gender } for authenticated users, or null for anonymous.
 */
export async function authenticateSocket(socket) {
  const token = socket.handshake.auth?.token;
  if (!token) return null;

  if (!supabase) {
    log.warn('Supabase not configured — skipping auth');
    return null;
  }

  try {
    const user = await verifyToken(token);
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, gender')
      .eq('id', user.id)
      .single();

    return profile || { id: user.id, email: user.email || 'Unknown', gender: null };
  } catch (err) {
    log.error('Auth failed:', err.message);
    return null;
  }
}
