-- avatar_style no cartão público (iniciais ou companheiro SVG)

ALTER TABLE public.user_public_cards
  ADD COLUMN IF NOT EXISTS avatar_style TEXT NOT NULL DEFAULT 'initials';
