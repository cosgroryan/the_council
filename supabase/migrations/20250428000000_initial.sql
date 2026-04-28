-- ============================================================
-- The Council — initial schema
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)
-- IMPORTANT: Disable email confirmation before testing:
--   Auth > Email Templates > "Confirm Email" → OFF
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id         UUID  REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name       TEXT  NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── api_keys ──────────────────────────────────────────────────
-- Anthropic API keys are encrypted client-side with AES-256-GCM
-- before being sent to this table.  The server never sees the
-- plaintext key.  Key derivation: PBKDF2(password, salt, 120 000
-- iterations, SHA-256) → 256-bit AES-GCM key.
CREATE TABLE public.api_keys (
  user_id       UUID  REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  encrypted_key TEXT  NOT NULL,  -- base64-encoded AES-GCM ciphertext
  iv            TEXT  NOT NULL,  -- base64-encoded 12-byte GCM nonce
  salt          TEXT  NOT NULL,  -- base64-encoded 16-byte PBKDF2 salt
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── councillors ───────────────────────────────────────────────
CREATE TABLE public.councillors (
  user_id       UUID  REFERENCES auth.users(id) ON DELETE CASCADE,
  councillor_id TEXT  NOT NULL,
  name          TEXT  NOT NULL,
  emoji         TEXT  NOT NULL,
  system_prompt TEXT  NOT NULL,
  active        BOOL  NOT NULL DEFAULT TRUE,
  sort_order    INT   NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, councillor_id)
);

-- ── sessions ─────────────────────────────────────────────────
CREATE TABLE public.sessions (
  id                  UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID  REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question            TEXT  NOT NULL,
  councillor_snapshot JSONB NOT NULL,  -- [{id,name,emoji}]
  results             JSONB NOT NULL,  -- [{id,name,emoji,content,error}]
  chairperson_content TEXT  NOT NULL,
  attached_files      JSONB NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER councillors_updated_at
  BEFORE UPDATE ON public.councillors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.councillors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions    ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "own profile" ON public.profiles
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- api_keys
CREATE POLICY "own api key" ON public.api_keys
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- councillors
CREATE POLICY "own councillors" ON public.councillors
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sessions
CREATE POLICY "own sessions" ON public.sessions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
