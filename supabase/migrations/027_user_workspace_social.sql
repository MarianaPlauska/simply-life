-- Workspace (personalização), convites e círculo de amigos

CREATE TABLE IF NOT EXISTS public.user_workspace_prefs (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  prefs      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_workspace_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_workspace_prefs_select" ON public.user_workspace_prefs;
CREATE POLICY "user_workspace_prefs_select"
  ON public.user_workspace_prefs FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_workspace_prefs_insert" ON public.user_workspace_prefs;
CREATE POLICY "user_workspace_prefs_insert"
  ON public.user_workspace_prefs FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_workspace_prefs_update" ON public.user_workspace_prefs;
CREATE POLICY "user_workspace_prefs_update"
  ON public.user_workspace_prefs FOR UPDATE
  USING (user_id = auth.uid());

-- Amizades antes das policies de cartão público
CREATE TABLE IF NOT EXISTS public.friend_invites (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  inviter_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  uses_left   INTEGER NOT NULL DEFAULT 8,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_friend_invites_inviter ON public.friend_invites (inviter_id);
CREATE INDEX IF NOT EXISTS ix_friend_invites_code ON public.friend_invites (code);

ALTER TABLE public.friend_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friend_invites_select_own" ON public.friend_invites;
CREATE POLICY "friend_invites_select_own"
  ON public.friend_invites FOR SELECT
  USING (inviter_id = auth.uid());

DROP POLICY IF EXISTS "friend_invites_select_valid" ON public.friend_invites;
CREATE POLICY "friend_invites_select_valid"
  ON public.friend_invites FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND expires_at > now()
    AND uses_left > 0
  );

DROP POLICY IF EXISTS "friend_invites_insert_own" ON public.friend_invites;
CREATE POLICY "friend_invites_insert_own"
  ON public.friend_invites FOR INSERT
  WITH CHECK (inviter_id = auth.uid());

DROP POLICY IF EXISTS "friend_invites_update_accept" ON public.friend_invites;
CREATE POLICY "friend_invites_update_accept"
  ON public.friend_invites FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND inviter_id != auth.uid()
    AND expires_at > now()
    AND uses_left > 0
  );

CREATE TABLE IF NOT EXISTS public.friendships (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_a     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_a, user_b)
);

CREATE INDEX IF NOT EXISTS ix_friendships_user_a ON public.friendships (user_a);
CREATE INDEX IF NOT EXISTS ix_friendships_user_b ON public.friendships (user_b);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friendships_select_participant" ON public.friendships;
CREATE POLICY "friendships_select_participant"
  ON public.friendships FOR SELECT
  USING (user_a = auth.uid() OR user_b = auth.uid());

DROP POLICY IF EXISTS "friendships_insert_participant" ON public.friendships;
CREATE POLICY "friendships_insert_participant"
  ON public.friendships FOR INSERT
  WITH CHECK (user_a = auth.uid() OR user_b = auth.uid());

-- Perfil público mínimo (streak, nível — sem finanças)
CREATE TABLE IF NOT EXISTS public.user_public_cards (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL DEFAULT '',
  axel_calls_you TEXT NOT NULL DEFAULT '',
  accent        TEXT NOT NULL DEFAULT 'copper',
  mascot_mood   TEXT NOT NULL DEFAULT 'calm',
  level         INTEGER NOT NULL DEFAULT 1,
  streak_count  INTEGER NOT NULL DEFAULT 0,
  episode_headline TEXT NOT NULL DEFAULT '',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_public_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_public_cards_select_friends" ON public.user_public_cards;
CREATE POLICY "user_public_cards_select_friends"
  ON public.user_public_cards FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.user_a = auth.uid() AND f.user_b = user_public_cards.user_id)
          OR (f.user_b = auth.uid() AND f.user_a = user_public_cards.user_id)
        )
    )
  );

DROP POLICY IF EXISTS "user_public_cards_own" ON public.user_public_cards;
CREATE POLICY "user_public_cards_own"
  ON public.user_public_cards FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth_key   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_own"
  ON public.push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
