import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.SUPABASE_JWT_SECRET;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Authenticate a socket connection using the JWT from handshake auth.
 * Returns { id, email, gender } for authenticated users, or null for anonymous.
 */
export async function authenticateSocket(socket) {
  const token = socket.handshake.auth?.token;
  if (!token) return null;

  if (!jwtSecret || !supabase) {
    console.warn('Supabase not configured — skipping auth');
    return null;
  }

  try {
    const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    const userId = payload.sub;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, gender')
      .eq('id', userId)
      .single();

    return profile || { id: userId, email: payload.email || 'Unknown', gender: null };
  } catch (err) {
    console.error('Auth failed:', err.message);
    return null;
  }
}
