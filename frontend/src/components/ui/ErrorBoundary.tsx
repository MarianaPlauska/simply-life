import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State>
{
  constructor (props: Props)
  {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError (error: Error): State
  {
    return { hasError: true, error };
  }

  componentDidCatch (error: Error, info: ErrorInfo)
  {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () =>
  {
    this.setState({ hasError: false, error: null });
  };

  render ()
  {
    if ( this.state.hasError )
    {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800/40 min-h-[200px]">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-zinc-200 font-semibold text-sm">
              {this.props.fallbackTitle || 'Algo deu errado nesta seção'}
            </p>
            <p className="text-zinc-500 text-xs mt-1 max-w-sm">
              {this.state.error?.message || 'Erro inesperado'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-violet-400
                       bg-violet-500/10 border border-violet-500/20 rounded-lg
                       hover:bg-violet-500/20 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
