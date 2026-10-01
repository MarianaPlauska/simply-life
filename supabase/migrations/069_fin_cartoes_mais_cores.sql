-- Mais cores para o cartão: vermelho, verde, azul, roxo e rosa (app mobile)

ALTER TABLE public.fin_cartoes DROP CONSTRAINT IF EXISTS fin_cartoes_tipo_gradiente_check;

ALTER TABLE public.fin_cartoes
  ADD CONSTRAINT fin_cartoes_tipo_gradiente_check
  CHECK (tipo_gradiente IN (
    'purple', 'obsidian', 'sunset', 'ocean', 'mint', 'copper',
    'wine', 'green', 'blue', 'violet', 'rose'
  ));
