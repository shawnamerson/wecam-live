-- Token System: tables, RPC functions, RLS policies
-- Run this in the Supabase SQL Editor

-- ============================================================
-- 1. Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.token_balances (
  user_id    UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  balance    INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.token_transactions (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  stripe_pi  TEXT,
  metadata   JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial unique index: only one transaction per Stripe PaymentIntent
CREATE UNIQUE INDEX IF NOT EXISTS uq_token_transactions_stripe_pi
  ON public.token_transactions (stripe_pi)
  WHERE stripe_pi IS NOT NULL;

-- ============================================================
-- 2. RPC Functions
-- ============================================================

-- credit_tokens: idempotent credit via Stripe PI
CREATE OR REPLACE FUNCTION public.credit_tokens(
  p_user_id   UUID,
  p_amount    INTEGER,
  p_stripe_pi TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate inputs
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be a positive integer';
  END IF;
  IF p_stripe_pi IS NULL OR p_stripe_pi = '' THEN
    RAISE EXCEPTION 'p_stripe_pi is required';
  END IF;

  -- Insert transaction; ON CONFLICT makes this idempotent
  INSERT INTO token_transactions (user_id, amount, type, stripe_pi)
  VALUES (p_user_id, p_amount, 'credit', p_stripe_pi)
  ON CONFLICT (stripe_pi) WHERE stripe_pi IS NOT NULL
  DO NOTHING;

  -- If the row already existed, FOUND will be false → skip balance update
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Upsert balance
  INSERT INTO token_balances (user_id, balance, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id)
  DO UPDATE SET balance    = token_balances.balance + EXCLUDED.balance,
               updated_at = now();
END;
$$;

-- deduct_token: atomic single-token deduction, returns true/false
CREATE OR REPLACE FUNCTION public.deduct_token(
  p_user_id  UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT balance INTO v_balance
    FROM token_balances
   WHERE user_id = p_user_id
   FOR UPDATE;

  -- No row or insufficient balance
  IF NOT FOUND OR v_balance < 1 THEN
    RETURN FALSE;
  END IF;

  -- Decrement balance
  UPDATE token_balances
     SET balance    = balance - 1,
         updated_at = now()
   WHERE user_id = p_user_id;

  -- Record the debit transaction
  INSERT INTO token_transactions (user_id, amount, type, metadata)
  VALUES (p_user_id, -1, 'debit', p_metadata);

  RETURN TRUE;
END;
$$;

-- ============================================================
-- 3. RLS & Permissions
-- ============================================================

ALTER TABLE public.token_balances      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions  ENABLE ROW LEVEL SECURITY;

-- Users can read their own balances
CREATE POLICY "Users can view own balance"
  ON public.token_balances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can read their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.token_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.token_balances     TO authenticated;
GRANT SELECT ON public.token_transactions TO authenticated;

GRANT ALL ON public.token_balances     TO service_role;
GRANT ALL ON public.token_transactions TO service_role;
