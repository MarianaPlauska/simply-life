import { useState, useEffect } from 'react';
import { Code2, Mail, MessageSquare, CalendarDays, HardDrive, Globe, Check, ChevronDown, ChevronUp, Key, Link2, Timer, Minus, Plus, Accessibility, Monitor, Bell, Database, Shield, Brain, Tag, Save, Loader2, ExternalLink, Unlink, ShoppingBag } from 'lucide-react';
import { AxelRewardShop } from '../gamification/AxelRewardShop';
import { toast } from 'sonner';
import { AXEL_PAGE_SHELL } from '../../constants/axelSurfaces';
import { useTaskStore } from '../../store/useTaskStore';
import { supabase } from '../../lib/supabase';
import type { LucideIcon } from 'lucide-react';
import { WebhookJarvisSection } from './WebhookJarvisSection';
import { AxelOnboardingWizard } from './AxelOnboardingWizard';
import { GmailImapSection } from './GmailImapSection';
import { PushTestSection } from './PushTestSection';
import { AccessibilityPanel } from '../dashboard/AccessibilityQuickMenu';
import { SETTINGS as S } from './settingsTheme';

type SettingsTab = 'integracoes' | 'webhook' | 'foco' | 'gamificacao' | 'acessibilidade' | 'ia' | 'sistema';

interface Platform {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  tokenLabel: string;
  placeholder: string;
}

const PLATFORMS: Platform[] = [
  { id: 'github', name: 'GitHub', description: 'Repositorios, Issues e Pull Requests', icon: Code2, tokenLabel: 'Personal Access Token', placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx' },
  { id: 'gmail', name: 'Gmail', description: 'E-mails e threads importantes', icon: Mail, tokenLabel: 'OAuth Token / App Password', placeholder: 'Token de acesso do Gmail' },
  { id: 'outlook', name: 'Outlook', description: 'E-mails corporativos e calendario', icon: MessageSquare, tokenLabel: 'Client Secret', placeholder: 'Token de acesso do Outlook' },
  { id: 'google_drive', name: 'Google Drive', description: 'Documentos, planilhas e armazenamento', icon: HardDrive, tokenLabel: 'OAuth Token', placeholder: 'Token de acesso do Google Drive' },
  { id: 'linkedin', name: 'LinkedIn', description: 'Perfil, conexoes e vagas de emprego', icon: Globe, tokenLabel: 'Access Token', placeholder: 'Token de acesso do LinkedIn' },
];

const TABS = [
  { id: 'integracoes' as SettingsTab, label: 'Integracoes', icon: Link2 },
  { id: 'webhook' as SettingsTab, label: 'Webhooks AXEL', icon: Code2 },
  { id: 'foco' as SettingsTab, label: 'Preferencias de Foco', icon: Timer },
  { id: 'gamificacao' as SettingsTab, label: 'Gamificacao', icon: ShoppingBag },
  { id: 'ia' as SettingsTab, label: 'Keywords & IA', icon: Brain },
  { id: 'acessibilidade' as SettingsTab, label: 'Acessibilidade', icon: Accessibility },
  { id: 'sistema' as SettingsTab, label: 'Sistema', icon: Monitor },
];

function GoogleCalendarCard() {
  const connected = useTaskStore((s) => s.googleCalendarConnected);
  const connectGoogle = useTaskStore((s) => s.connectGoogleCalendar);
  const disconnectGoogle = useTaskStore((s) => s.disconnectGoogleCalendar);
  const checkStatus = useTaskStore((s) => s.checkGoogleStatus);
  const sincronizarGmail = useTaskStore((s) => s.sincronizarGmail);
  const isSyncingGmail = useTaskStore((s) => s.isSyncingGmail);
  const lastSyncResult = useTaskStore((s) => s.lastSyncResult);
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  async function handleConnect() {
    setLoading(true);
    try {
      await connectGoogle();
    } catch {
      toast.error('Erro ao iniciar conexao com Google');
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await disconnectGoogle();
      toast.success('Google desconectado');
    } catch {
      toast.error('Erro ao desconectar');
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleGmailSync() {
    try {
      const result = await sincronizarGmail();
      if (!result) {
        toast.error('Sync não disponível — faça login ou conecte o Google');
        return;
      }
      toast.success(`${result.tarefas_geradas} tarefa(s) de ${result.emails_lidos} e-mail(s)`);
    } catch {
      toast.error('Erro ao sincronizar Gmail');
    }
  }

  return (
    <div className={`group relative border rounded-sl overflow-hidden transition-all duration-300 ${connected ? 'bg-concluido/[0.03] border-concluido/20' : S.accentPanel}`}>
      <div className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-sl transition-colors ${connected ? S.successIconBg : S.accentIconBg}`}>
          <CalendarDays className={`w-5 h-5 ${connected ? S.successText : S.iconAccent}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={S.rowTitle}>Google OAuth (opcional)</h3>
          <p className={S.rowHint}>
            {connected
              ? 'OAuth ativo — exige projeto no Google Cloud'
              : 'Opcional. Para e-mail grátis, use Gmail com senha de app acima.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {connected ? (
            <>
              <span className={`flex items-center gap-1.5 text-[12px] font-medium ${S.successText} bg-concluido/10 px-2.5 py-1 rounded-pill`}>
                <Check className="w-3.5 h-3.5" /> Conectado
              </span>
              <button
                type="button"
                onClick={() => void handleGmailSync()}
                disabled={isSyncingGmail}
                className="px-3 py-1.5 text-[12px] font-medium rounded-sl border border-accent/25 text-accent hover:bg-accent/10 transition-all flex items-center gap-1.5 disabled:opacity-40"
              >
                {isSyncingGmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                Sync Gmail
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-3 py-1.5 text-[12px] font-medium rounded-lg border border-red-500/20 text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center gap-1.5 disabled:opacity-40"
              >
                {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
                Desconectar
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className={`${S.btnPrimary} flex items-center gap-2 disabled:opacity-40 shadow-sm`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Conectar Google
            </button>
          )}
        </div>
      </div>
      {connected && lastSyncResult && (
        <p className="px-5 pb-4 text-[11px] text-ink-muted font-mono tabular-nums">
          Último sync: {lastSyncResult.emails_lidos} e-mails · {lastSyncResult.tarefas_geradas} tarefas
        </p>
      )}
    </div>
  );
}

function PlatformCard({ platform }: { platform: Platform }) {
  const [connected, setConnected] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const Icon = platform.icon;

  async function handleSave() {
    if (!token.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('integracoes').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        plataforma: platform.id,
        token_criptografado: token,
        status: 'ativa',
      });
      if (error) throw error;
      setConnected(true);
      setExpanded(false);
      setToken('');
      toast.success('Conectado e Criptografado');
    } catch {
      toast.error('Erro ao conectar integracao');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`group relative border rounded-sl overflow-hidden transition-all ${connected ? `${S.successBorder} shadow-sm` : 'border-line hover:border-accent/20'} ${S.cardMuted}`}>
      <div className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-sl transition-colors ${connected ? S.successIconBg : 'bg-chrome'}`}>
          <Icon className={`w-5 h-5 ${connected ? S.successText : S.iconMuted}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={S.rowTitle}>{platform.name}</h3>
          <p className={S.rowHint}>{platform.description}</p>
        </div>
        <div className="flex items-center gap-3">
          {connected ? (
            <span className={`flex items-center gap-1.5 text-[12px] font-medium ${S.successText} bg-concluido/10 px-2.5 py-1 rounded-pill`}>
              <Check className="w-3.5 h-3.5" /> Conectado
            </span>
          ) : (
            <span className="text-[12px] font-medium text-ink-muted">Nao conectado</span>
          )}
          <button onClick={() => setExpanded((e) => !e)} className={`${S.btnSecondary} flex items-center gap-1.5`}>
            Configurar
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className={`px-5 pb-5 ${S.divider} pt-4`}>
          <label className={`flex items-center gap-2 text-xs font-medium text-ink-muted mb-2`}>
            <Key className="w-3.5 h-3.5" /> {platform.tokenLabel}
          </label>
          <div className="flex gap-3">
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder={platform.placeholder} className={`flex-1 ${S.input}`} />
            <button onClick={handleSave} disabled={!token.trim() || saving} className={`px-5 py-2.5 ${S.btnPrimary} disabled:cursor-not-allowed`}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
          <p className="text-[11px] text-ink-muted mt-2.5">Sua chave e armazenada com criptografia e nunca e exibida novamente.</p>
        </div>
      )}
    </div>
  );
}

function TimerSetting({ label, description, value, onChange }: { label: string; description: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-5 border-b border-line last:border-0">
      <div>
        <p className={S.label}>{label}</p>
        <p className="text-xs text-ink-muted mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(1, value - 5))} className="p-1.5 rounded-sl bg-chrome border border-line text-ink-muted hover:text-ink transition-colors">
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-lg font-semibold text-ink tabular-nums w-12 text-center">{value}</span>
        <span className="text-xs text-ink-muted">min</span>
        <button onClick={() => onChange(Math.min(120, value + 5))} className="p-1.5 rounded-sl bg-chrome border border-line text-ink-muted hover:text-ink transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* Reusable toggle row for non-store settings */
function ToggleRow({ icon: Icon, label, description, defaultOn = false }: { icon: React.ElementType; label: string; description: string; defaultOn?: boolean }) {
  const [enabled, setEnabled] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-ink-muted" aria-hidden="true" />
        <div>
          <p className="text-[13px] font-medium text-ink">{label}</p>
          <p className="text-[11px] text-ink-muted mt-0.5">{description}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        aria-label={`${label}: ${enabled ? 'ativado' : 'desativado'}`}
        onClick={() => setEnabled((v) => !v)}
        className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-accent' : 'bg-chrome border border-line'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('integracoes');
  const timerConfig = useTaskStore((s) => s.timerConfig);
  const setTimerConfig = useTaskStore((s) => s.setTimerConfig);
  const keywords = useTaskStore((s) => s.keywords);
  const saveKeywords = useTaskStore((s) => s.saveKeywords);
  const fetchPreferencias = useTaskStore((s) => s.fetchPreferencias);

  const [kwInput, setKwInput] = useState(keywords.join(', '));
  const [savingKw, setSavingKw] = useState(false);

  useEffect(() => { setKwInput(keywords.join(', ')); }, [keywords]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchPreferencias(); }, []);

  const handleSaveKeywords = async () => {
    setSavingKw(true);
    const parsed = kwInput.split(',').map((k: string) => k.trim()).filter(Boolean);
    try {
      await saveKeywords(parsed);
    } catch {
      /* toast is handled inside saveKeywords */
    } finally {
      setSavingKw(false);
    }
  };

  const kwList = kwInput.split(',').map((k: string) => k.trim()).filter(Boolean);

  return (
    <div className={`${AXEL_PAGE_SHELL} px-3 sm:px-4 lg:px-6 xl:px-8 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-12`}>
      <div className="mb-6 sm:mb-8">
        <h1 className={S.title}>Configuracoes</h1>
        <p className={S.subtitle}>Gerencie integracoes e preferencias do Simply-Life.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        <nav className="md:w-56 shrink-0 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto md:overflow-visible">
          <div className="flex md:flex-col gap-1.5 md:gap-1 min-w-max md:min-w-0 pb-1 md:pb-0">
            {TABS.map(({ id, label, icon: TabIcon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 rounded-sl text-[12px] md:text-[13px] font-medium transition-all whitespace-nowrap ${isActive ? S.navActive : S.navIdle}`}
                >
                  <TabIcon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {/* === INTEGRACOES === */}
          {activeTab === 'integracoes' && (
            <div className="space-y-4">
              <AxelOnboardingWizard onSelectTab={(tab) => setActiveTab(tab)} />
              <GmailImapSection />
              <div className="mb-6 mt-6">
                <h2 className={S.sectionTitle}>Integracoes</h2>
                <p className={S.sectionHint}>Conecte suas plataformas para o Simply-Life capturar dados automaticamente.</p>
              </div>

              {/* Google Calendar OAuth2 */}
              <GoogleCalendarCard />

              {PLATFORMS.map((p) => <PlatformCard key={p.id} platform={p} />)}
            </div>
          )}

          {activeTab === 'webhook' && <WebhookJarvisSection />}

          {activeTab === 'gamificacao' && (
            <div>
              <div className="mb-6">
                <h2 className={S.sectionTitle}>Gamificacao</h2>
                <p className={S.sectionHint}>
                  Troque XP por recompensas e proteja sua ofensiva diaria.
                </p>
              </div>
              <AxelRewardShop />
            </div>
          )}

          {/* === FOCO === */}
          {activeTab === 'foco' && (
            <div>
              <div className="mb-6">
                <h2 className={S.sectionTitle}>Preferencias de Foco</h2>
                <p className={S.sectionHint}>Configure os tempos do Modo Foco. As alteracoes sao aplicadas imediatamente.</p>
              </div>
              <div className={`${S.card} px-6`}>
                <TimerSetting label="Sessao de Foco" description="Duracao da sessao de trabalho concentrado" value={timerConfig.pomodoroTime} onChange={(v) => setTimerConfig('pomodoroTime', v)} />
                <TimerSetting label="Pausa Curta" description="Intervalo rapido entre sessoes" value={timerConfig.shortBreak} onChange={(v) => setTimerConfig('shortBreak', v)} />
                <TimerSetting label="Pausa Longa" description="Descanso estendido apos ciclo completo" value={timerConfig.longBreak} onChange={(v) => setTimerConfig('longBreak', v)} />
              </div>
              <div className="mt-6">
                <p className="text-xs text-ink-muted mb-3">Presets rapidos</p>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { label: 'Padrao', pomodoro: 25, short: 5, long: 15 },
                    { label: 'Intenso', pomodoro: 50, short: 10, long: 20 },
                    { label: 'Curto', pomodoro: 15, short: 3, long: 10 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => { setTimerConfig('pomodoroTime', preset.pomodoro); setTimerConfig('shortBreak', preset.short); setTimerConfig('longBreak', preset.long); toast.success(`Preset "${preset.label}" aplicado`); }}
                      className={`${S.btnSecondary}`}
                    >
                      {preset.label}
                      <span className="text-ink-muted ml-1.5">{preset.pomodoro}/{preset.short}/{preset.long}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* === KEYWORDS & IA === */}
          {activeTab === 'ia' && (
            <div>
              <div className="mb-6">
                <h2 className={S.sectionTitle}>Filtro de Keywords & IA</h2>
                <p className={S.sectionHint}>
                  Defina palavras-chave para o motor de score priorizar automaticamente tarefas relevantes.
                </p>
              </div>

              <div className={`${S.card} p-6 space-y-5`}>
                <div>
                  <label className="flex items-center gap-2 text-[12px] font-semibold text-ink mb-2">
                    <Tag className={`w-3.5 h-3.5 ${S.iconAccent}`} />
                    Palavras-chave de Prioridade
                  </label>
                  <p className="text-[11px] text-ink-muted mb-3">
                    Separe por virgulas. Quando o titulo de uma tarefa conter uma dessas palavras, o score de urgencia recebe +50 automaticamente.
                  </p>
                  <textarea
                    value={kwInput}
                    onChange={(e) => setKwInput(e.target.value)}
                    placeholder="urgente, bug, boleto, vaga, deadline, deploy, producao"
                    rows={3}
                    className={S.textarea}
                  />
                </div>

                {kwList.length > 0 && (
                  <div>
                    <p className="text-[11px] text-ink-muted mb-2">{kwList.length} keyword{kwList.length > 1 ? 's' : ''} ativa{kwList.length > 1 ? 's' : ''}</p>
                    <div className="flex flex-wrap gap-2">
                      {kwList.map((kw: string, i: number) => (
                        <span key={i} className={S.tag}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSaveKeywords}
                  disabled={savingKw}
                  className={`flex items-center gap-2 ${S.btnPrimary} disabled:cursor-not-allowed`}
                >
                  {savingKw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {savingKw ? 'Salvando...' : 'Salvar no Servidor'}
                </button>
              </div>

              {/* How it works */}
              <div className={`mt-6 ${S.card} p-6`}>
                <h3 className="text-[13px] font-semibold text-ink mb-3">Como funciona</h3>
                <div className="space-y-3 text-[12px] text-ink-muted leading-relaxed">
                  <div className="flex gap-3">
                    <span className={`shrink-0 w-6 h-6 rounded-sl bg-accent/10 text-accent flex items-center justify-center text-[11px] font-bold`}>1</span>
                    <p>Voce define palavras-chave como <span className="text-accent font-medium">urgente, bug, boleto</span></p>
                  </div>
                  <div className="flex gap-3">
                    <span className={`shrink-0 w-6 h-6 rounded-sl bg-accent/10 text-accent flex items-center justify-center text-[11px] font-bold`}>2</span>
                    <p>Quando uma tarefa chega via webhook (GitHub, Gmail, etc), o <span className="text-ink font-medium">Motor de Score</span> analisa o titulo</p>
                  </div>
                  <div className="flex gap-3">
                    <span className={`shrink-0 w-6 h-6 rounded-sl bg-accent/10 text-accent flex items-center justify-center text-[11px] font-bold`}>3</span>
                    <p>Se o titulo contem alguma keyword, a tarefa recebe <span className="text-concluido font-bold">+50 pontos</span> de urgencia automaticamente</p>
                  </div>
                  <div className="flex gap-3">
                    <span className={`shrink-0 w-6 h-6 rounded-sl bg-accent/10 text-accent flex items-center justify-center text-[11px] font-bold`}>4</span>
                    <p>Tarefas com score alto sobem no Kanban e aparecem primeiro no modo <span className="text-ink font-medium">Superhuman</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === ACESSIBILIDADE === */}
          {activeTab === 'acessibilidade' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-display text-ink">Acessibilidade</h2>
                <p className="text-xs text-ink-muted mt-1">
                  Papel creme estilo Kindle, texto preto forte e alto contraste.
                </p>
              </div>
              <AccessibilityPanel variant="page" />
            </div>
          )}

          {/* === SISTEMA === */}
          {activeTab === 'sistema' && (
            <div>
              <div className="mb-6">
                <h2 className={S.sectionTitle}>Sistema</h2>
                <p className={S.sectionHint}>Configuracoes tecnicas, dados e comportamento do aplicativo.</p>
              </div>
              <div className={`${S.card} px-6 divide-y divide-line`}>
                <ToggleRow icon={Bell} label="Notificacoes Push" description="Receba alertas de tarefas e lembretes" defaultOn />
                <ToggleRow icon={Database} label="Cache Local" description="Armazena dados offline em localStorage" defaultOn />
                <ToggleRow icon={Shield} label="Criptografia de Tokens" description="Tokens de integracao encriptados em repouso" defaultOn />
                <ToggleRow icon={Monitor} label="Auto-refresh de Dados" description="Recarrega tarefas e despesas a cada 5 minutos" />
              </div>
              <PushTestSection />
              <div className={`mt-6 ${S.card} p-6 space-y-4`}>
                <h3 className="text-[13px] font-semibold text-ink">Dados e Armazenamento</h3>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-muted">Cache do navegador</span>
                  <button
                    onClick={() => { localStorage.removeItem('simply-life-store'); toast.success('Cache limpo com sucesso'); }}
                    className="px-3 py-1.5 text-[12px] font-medium text-red-400 border border-red-800/40 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    Limpar cache
                  </button>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-muted">Versao do app</span>
                  <span className="text-ink-muted font-mono text-[12px]">v1.0.0-alpha</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-muted">Backend</span>
                  <span className="text-ink-muted font-mono text-[12px]">Supabase (zuxkqmooxvnulgllduhr)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
