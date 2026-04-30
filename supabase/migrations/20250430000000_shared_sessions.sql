-- ── shared_sessions ──────────────────────────────────────────
-- Stores public share tokens. Anyone with the token can read
-- the associated session; only the owner can create/revoke.

CREATE TABLE IF NOT EXISTS public.shared_sessions (
  share_token     TEXT        PRIMARY KEY,
  session_id      UUID        REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  owner_user_id   UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.shared_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public read shared token" ON public.shared_sessions
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "owner insert share" ON public.shared_sessions
    FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "owner delete share" ON public.shared_sessions
    FOR DELETE USING (auth.uid() = owner_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "shared session public read" ON public.sessions
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.shared_sessions
        WHERE session_id = id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
