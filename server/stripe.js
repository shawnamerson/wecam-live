import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export const TOKEN_PACKAGES = [
  { id: 'pack_10', tokens: 10, price: 199, label: '10 Tokens', description: 'Try it out' },
  { id: 'pack_50', tokens: 50, price: 799, label: '50 Tokens', description: 'Most popular' },
  { id: 'pack_150', tokens: 150, price: 1999, label: '150 Tokens', description: 'Best value' },
];

export async function createPaymentIntent(packageId, userId) {
  if (!stripe) throw new Error('Stripe not configured');

  const pkg = TOKEN_PACKAGES.find(p => p.id === packageId);
  if (!pkg) throw new Error('Invalid package');

  const paymentIntent = await stripe.paymentIntents.create({
    amount: pkg.price,
    currency: 'usd',
    metadata: { userId, packageId, tokens: String(pkg.tokens) },
  });

  return { clientSecret: paymentIntent.client_secret };
}

export async function handleWebhook(rawBody, signature) {
  if (!stripe || !supabase) throw new Error('Stripe/Supabase not configured');

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error('Webhook secret not configured');

  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  if (event.type === 'payment_intent.succeeded') {
    const { userId, tokens } = event.data.object.metadata;
    const piId = event.data.object.id;
    const tokenCount = parseInt(tokens, 10);

    if (userId && tokenCount > 0) {
      const { error } = await supabase.rpc('credit_tokens', {
        p_user_id: userId,
        p_amount: tokenCount,
        p_stripe_pi: piId,
      });
      if (error) console.error('Failed to credit tokens:', error);
      else console.log(`Credited ${tokenCount} tokens to ${userId}`);
    }
  }

  return { received: true };
}

export async function getTokenBalance(userId) {
  if (!supabase) return 0;
  const { data } = await supabase
    .from('token_balances')
    .select('balance')
    .eq('user_id', userId)
    .single();
  return data?.balance ?? 0;
}

export async function deductToken(userId, metadata = {}) {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('deduct_token', {
    p_user_id: userId,
    p_metadata: metadata,
  });
  if (error) {
    console.error('deduct_token error:', error);
    return false;
  }
  return data === true;
}
