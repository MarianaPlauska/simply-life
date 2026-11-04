-- Rodar UMA vez no SQL Editor do Supabase, depois da 084.
-- Chama o servidor a cada 5 minutos para mandar os avisos do Meu Mundo pelo site (iPhone).
-- Troque COLE_O_CRON_SECRET pelo valor de CRON_SECRET da Vercel (Settings > Environment Variables).
-- Não salve este arquivo com o segredo de verdade no git.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('meu-mundo-avisos')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'meu-mundo-avisos');

SELECT cron.schedule(
  'meu-mundo-avisos',
  '*/5 * * * *',
  $$
  SELECT net.http_get(
    url := 'https://simply-life.vercel.app/api/cron/push-blocos',
    headers := jsonb_build_object('Authorization', 'Bearer COLE_O_CRON_SECRET')
  );
  $$
);

-- limpeza semanal do registro de avisos enviados
SELECT cron.unschedule('meu-mundo-avisos-limpeza')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'meu-mundo-avisos-limpeza');

SELECT cron.schedule(
  'meu-mundo-avisos-limpeza',
  '0 4 * * 0',
  $$ DELETE FROM public.bloco_avisos_enviados WHERE sent_at < now() - interval '7 days'; $$
);
