import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';

type CallbackStatus = 'processing' | 'success' | 'error';

export function GoogleCallbackView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const processCallback = useTaskStore((s) => s.processGoogleCallback);
  const authToken = useTaskStore((s) => s.authToken);
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMsg, setErrorMsg] = useState('Erro ao conectar Google Calendar');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMsg(error === 'access_denied' ? 'Acesso negado pelo usuario' : `Erro Google: ${error}`);
      toast.error('Autorizacao cancelada');
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMsg('Codigo de autorizacao nao encontrado na URL');
      toast.error('Callback invalido');
      return;
    }

    if (!authToken) {
      setStatus('error');
      setErrorMsg('Sessao expirada. Faca login novamente antes de conectar o Google.');
      toast.error('Sessao expirada');
      return;
    }

    processCallback(code).then((ok) => {
      if (ok) {
        setStatus('success');
        toast.success('Google Calendar conectado com sucesso!');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setStatus('error');
        setErrorMsg('O servidor rejeitou a integracao. Tente novamente.');
        toast.error('Erro ao conectar Google Calendar');
      }
    });
  }, [searchParams, processCallback, navigate, authToken]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="text-center space-y-4">
        {status === 'processing' && (
          <>
            <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto" />
            <p className="text-zinc-300 text-sm">Conectando Google Calendar...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-zinc-300 text-sm">Conectado! Redirecionando...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-zinc-300 text-sm">{errorMsg}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-2 px-4 py-2 text-sm rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
