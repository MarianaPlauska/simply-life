import { useState, useEffect } from 'react';
import { Code2, Copy, RefreshCw, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

function randomSecret(): string
{
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function WebhookJarvisSection()
{
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasSecret, setHasSecret] = useState(false);
  const [plainSecret, setPlainSecret] = useState<string | null>(null);

  const endpoint =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhook-ingest`
      : '/api/webhook-ingest';

  useEffect(() =>
  {
    (async () =>
    {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user)
      {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('user_webhook_secrets')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      setHasSecret(Boolean(data));
      setLoading(false);
    })();
  }, []);

  const handleGenerate = async () =>
  {
    setSaving(true);
    try
    {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user)
      {
        toast.error('Faça login para gerar o secret.');
        return;
      }

      const secret = randomSecret();
      const { error } = await supabase
        .from('user_webhook_secrets')
        .upsert({
          user_id: user.id,
          secret,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setHasSecret(true);
      setPlainSecret(secret);
      toast.success('Secret gerado. Copie agora — não será exibido de novo.');
    }
    catch (e)
    {
      console.error(e);
      toast.error('Erro ao salvar secret. Rode a migration 010 no Supabase.');
    }
    finally
    {
      setSaving(false);
    }
  };

  const copy = (text: string, label: string) =>
  {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Code2 className="w-5 h-5 text-violet-400" />
          Webhooks Jarvis (M2M)
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          GitHub, Gmail (Zapier/Make) ou qualquer serviço envia eventos para triagem automática no Supabase.
        </p>
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Endpoint</p>
          <div className="flex gap-2">
            <code className="flex-1 text-xs text-violet-300 bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800 break-all">
              {endpoint}
            </code>
            <button
              type="button"
              onClick={() => copy(endpoint, 'Endpoint')}
              className="p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-zinc-400">
            Status: {loading ? '…' : hasSecret ? 'Secret configurado' : 'Nenhum secret — gere abaixo'}
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={saving}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {hasSecret ? 'Regenerar secret' : 'Gerar secret'}
          </button>
        </div>

        {plainSecret && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-[10px] font-bold text-amber-400 uppercase mb-2">Secret (copie agora)</p>
            <code className="text-xs text-amber-200 break-all">{plainSecret}</code>
            <button
              type="button"
              onClick={() => copy(plainSecret, 'Secret')}
              className="mt-2 text-[10px] font-bold text-amber-300 hover:text-amber-200"
            >
              Copiar secret
            </button>
          </div>
        )}
      </div>

      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-5">
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Payload mínimo</p>
        <pre className="text-[11px] text-zinc-400 overflow-x-auto">
{`{
  "user_id": "<seu-uuid-supabase>",
  "items": [
    {
      "subject": "Título ou assunto",
      "body": "Corpo resumido (opcional)",
      "sender": "github|gmail",
      "origem": "github_issue | gmail | webhook"
    }
  ]
}`}
        </pre>
        <p className="text-[10px] text-zinc-600 mt-3">
          Header obrigatório: <code className="text-zinc-400">X-Webhook-Signature: sha256=&lt;hmac-do-body&gt;</code>
        </p>
      </div>
    </div>
  );
}
