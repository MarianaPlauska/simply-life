// E3: hook de websocket para sync em tempo real
import { useEffect, useRef } from 'react';
import { useTaskStore } from '../store/useTaskStore';

const WS_URL = 'ws://127.0.0.1:8000/ws';
const RECONNECT_DELAY = 3000;

export function useRealtimeSync ()
{
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() =>
  {
    let unmounted = false;

    function connect ()
    {
      if ( unmounted ) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () =>
      {
        console.log('[ws] conectado');
      };

      ws.onmessage = (ev) =>
      {
        try
        {
          const msg = JSON.parse(ev.data);
          if ( msg.type === 'pong' ) return;

          if ( msg.type === 'tarefa_criada' && msg.tarefa )
          {
            useTaskStore.setState((s) =>
            {
              const exists = s.tarefas.some((t) => t.id === msg.tarefa.id);
              if ( exists ) return s;
              return { tarefas: [msg.tarefa, ...s.tarefas] };
            });
          }
          else if ( msg.type === 'tarefa_atualizada' && msg.tarefa )
          {
            useTaskStore.setState((s) => ({
              tarefas: s.tarefas.map((t) => (t.id === msg.tarefa.id ? { ...t, ...msg.tarefa } : t)),
            }));
          }
          else if ( msg.type === 'tarefa_deletada' && msg.tarefa_id )
          {
            useTaskStore.setState((s) => ({
              tarefas: s.tarefas.filter((t) => t.id !== msg.tarefa_id),
            }));
          }
        }
        catch (e)
        {
          console.warn('[ws] mensagem inválida:', e);
        }
      };

      ws.onclose = () =>
      {
        if ( unmounted ) return;
        console.log('[ws] desconectado — reconectando em', RECONNECT_DELAY, 'ms');
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = () =>
      {
        ws.close();
      };
    }

    connect();

    // keepalive — envia ping a cada 30s
    const pingInterval = setInterval(() =>
    {
      if ( wsRef.current?.readyState === WebSocket.OPEN )
      {
        wsRef.current.send('ping');
      }
    }, 30_000);

    return () =>
    {
      unmounted = true;
      clearInterval(pingInterval);
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);
}
