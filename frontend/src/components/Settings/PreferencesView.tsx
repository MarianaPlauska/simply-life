import { useEffect, useState, useRef, useMemo } from 'react';
import {
  Tag, X, Save, Loader2, Columns, CalendarDays, Crosshair, Wallet,
  Plus, Search, Trash2, Brain, Filter, SlidersHorizontal,
  Bell, Shield, Eye, Globe, Moon, Sun, Zap, Layout, Monitor,
  Smartphone, Clock, Palette, AlertTriangle, Info, Sparkles, KeyRound,
  Fingerprint, RefreshCw, Volume2, VolumeX,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';
import { supabase } from '../../lib/supabase';

/* ── Tipos ────────────────────────────────────────────────── */
type SettingsTab = 'geral' | 'ia' | 'aparencia' | 'notificacoes' | 'seguranca';

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: TabConfig[] = [
  { id: 'geral',        label: 'Geral',         icon: SlidersHorizontal, description: 'Módulos e atalhos' },
  { id: 'ia',           label: 'IA & Triagem',   icon: Brain,             description: 'Keywords e automação' },
  { id: 'aparencia',    label: 'Aparência',      icon: Palette,           description: 'Tema e layout' },
  { id: 'notificacoes', label: 'Notificações',   icon: Bell,              description: 'Alertas e sons' },
  { id: 'seguranca',    label: 'Segurança',      icon: Shield,            description: 'Privacidade e dados' },
];

const MODULOS_FIXAVEIS = [
  { id: 'kanban',      label: 'Kanban',       icon: Columns,      desc: 'Quadro de tarefas visual' },
  { id: 'superhuman',  label: 'Agenda',       icon: CalendarDays,  desc: 'Calendário e eventos' },
  { id: 'foco',        label: 'Modo Foco',    icon: Crosshair,     desc: 'Temporizador Pomodoro' },
  { id: 'financeiro',  label: 'Finanças',     icon: Wallet,        desc: 'Planejador financeiro' },
  { id: 'saude',       label: 'Saúde',        icon: Zap,           desc: 'Hábitos e bem-estar' },
  { id: 'anotacoes',   label: 'Anotações',    icon: Layout,        desc: 'Segundo cérebro' },
];

/* ── Componentes auxiliares ───────────────────────────────── */

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm p-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, iconColor = 'text-ia' }: {
  icon: React.ElementType; title: string; subtitle: string; iconColor?: string;
}) {
  return (
    <div className="mb-5">
      <h3 className="text-[15px] font-semibold text-white flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-zinc-800/60 flex items-center justify-center">
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        {title}
      </h3>
      <p className="text-[12px] text-zinc-500 mt-1 ml-[42px]">{subtitle}</p>
    </div>
  );
}

function ToggleSwitch({ active, onChange, size = 'md' }: {
  active: boolean; onChange: () => void; size?: 'sm' | 'md';
}) {
  const w = size === 'sm' ? 'w-9 h-5' : 'w-11 h-6';
  const dot = size === 'sm'
    ? `w-3.5 h-3.5 top-[3px] ${active ? 'translate-x-[17px]' : 'translate-x-[3px]'}`
    : `w-4 h-4 top-[4px] ${active ? 'translate-x-[22px]' : 'translate-x-[3px]'}`;
  return (
    <button
      onClick={onChange}
      className={`${w} rounded-full transition-colors relative shrink-0 ${active ? 'bg-ia' : 'bg-zinc-700'}`}
    >
      <div className={`absolute ${dot} rounded-full bg-white shadow-sm transition-transform`} />
    </button>
  );
}

function SettingRow({ icon: Icon, label, desc, children, iconColor = 'text-zinc-400' }: {
  icon: React.ElementType; label: string; desc?: string; children: React.ReactNode; iconColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon className={`w-[18px] h-[18px] ${iconColor} shrink-0`} />
        <div className="min-w-0">
          <p className="text-[13px] text-zinc-200 font-medium">{label}</p>
          {desc && <p className="text-[11px] text-zinc-500 mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="ml-4 shrink-0">{children}</div>
    </div>
  );
}

/* ── Componente principal ─────────────────────────────────── */

export function PreferencesView() {
  const registerInteraction = useTaskStore((s) => s.registerInteraction);
  const storeKeywords = useTaskStore((s) => s.keywords);
  const fetchPreferencias = useTaskStore((s) => s.fetchPreferencias);
  const saveKeywords = useTaskStore((s) => s.saveKeywords);
  const accessibility = useTaskStore((s) => s.accessibility);
  const setAccessibility = useTaskStore((s) => s.setAccessibility);

  const [activeTab, setActiveTab] = useState<SettingsTab>('geral');
  const [inputValue, setInputValue] = useState('');
  const [modulosFixados, setModulosFixados] = useState<string[]>(['dashboard', 'kanban']);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [keywordFilter, setKeywordFilter] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifSound, setNotifSound] = useState(true);
  const [notifUrgentOnly, setNotifUrgentOnly] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [compactMode, setCompactMode] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(24);
  const [notifTarefas, setNotifTarefas] = useState(true);
  const [notifSaude, setNotifSaude] = useState(true);
  const [notifFinanceiro, setNotifFinanceiro] = useState(true);
  const [notifSistema, setNotifSistema] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    registerInteraction('inteligencia');
    fetchPreferencias().finally(() => setLoaded(true));
  }, []);

  /* ── Keyword actions ────────────────────────────────────── */
  const removeKeyword = (word: string) => {
    saveKeywords(storeKeywords.filter((k) => k !== word));
    toast.success('Palavra removida');
  };

  const clearAllKeywords = () => {
    if (storeKeywords.length === 0) return;
    saveKeywords([]);
    toast.success('Todas as palavras-chave removidas');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAddClick(); }
  };

  const handleAddClick = () => {
    if (!inputValue.trim()) return;
    let count = 0;
    let updated = [...storeKeywords];
    inputValue.split(',').forEach((p) => {
      const word = p.trim().toLowerCase();
      if (word && !updated.includes(word)) { updated.push(word); count++; }
    });
    if (count > 0) {
      saveKeywords(updated);
      toast.success(`${count} palavra${count > 1 ? 's' : ''} adicionada${count > 1 ? 's' : ''}`, {
        description: 'A IA agora priorizará esses termos.',
      });
    } else {
      toast.info('Palavras já existem na lista');
    }
    setInputValue('');
    inputRef.current?.focus();
  };

  const toggleModulo = (id: string) => {
    setModulosFixados((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) { toast.error('Sessão expirada'); return; }
      const { error } = await supabase
        .from('preferencias_usuario')
        .upsert({
          user_id: uid,
          palavras_chave_email: storeKeywords.join(','),
          modulos_fixados: modulosFixados.join(','),
        }, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('Preferências salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  };

  const filteredKeywords = useMemo(() => {
    if (!keywordFilter.trim()) return storeKeywords;
    const q = keywordFilter.toLowerCase();
    return storeKeywords.filter((kw) => kw.includes(q));
  }, [storeKeywords, keywordFilter]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  /* ── Tab: Geral ─────────────────────────────────────────── */
  const renderGeral = () => (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader icon={Layout} title="Módulos do Header" subtitle="Escolha quais módulos ficam fixados no topo para acesso rápido." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODULOS_FIXAVEIS.map(({ id, label, icon: Icon, desc }) => {
            const active = modulosFixados.includes(id);
            return (
              <div
                key={id}
                role="group"
                className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all text-left cursor-pointer ${
                  active
                    ? 'bg-ia/5 border-ia/20 ring-1 ring-ia/10'
                    : 'bg-zinc-800/20 border-zinc-800/40 hover:border-zinc-700/50 hover:bg-zinc-800/30'
                }`}
                onClick={() => toggleModulo(id)}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-ia/10' : 'bg-zinc-800/60'}`}>
                  <Icon className={`w-[18px] h-[18px] ${active ? 'text-ia' : 'text-zinc-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-[13px] font-medium ${active ? 'text-white' : 'text-zinc-400'}`}>{label}</span>
                    <ToggleSwitch active={active} onChange={() => toggleModulo(id)} size="sm" />
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-0.5">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader icon={Clock} title="Pomodoro & Tempo" subtitle="Ajuste os intervalos do temporizador de foco." iconColor="text-emerald-400" />
        <div className="divide-y divide-zinc-800/50">
          <SettingRow icon={Crosshair} label="Tempo de foco" desc="Duração de cada sessão Pomodoro" iconColor="text-emerald-400">
            <select className="bg-zinc-800/50 border border-zinc-700/40 rounded-lg px-3 py-1.5 text-[12px] text-white outline-none focus:ring-2 focus:ring-ia/30">
              <option value={25}>25 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
            </select>
          </SettingRow>
          <SettingRow icon={RefreshCw} label="Pausa curta" desc="Intervalo entre sessões" iconColor="text-blue-400">
            <select className="bg-zinc-800/50 border border-zinc-700/40 rounded-lg px-3 py-1.5 text-[12px] text-white outline-none focus:ring-2 focus:ring-ia/30">
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
            </select>
          </SettingRow>
        </div>
      </SectionCard>
    </div>
  );

  /* ── Tab: IA & Triagem ──────────────────────────────────── */
  const renderIA = () => (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader icon={Tag} title="Palavras-chave da IA" subtitle="Termos que a IA usará para filtrar e priorizar seus e-mails e tarefas." />
        <div className="flex items-center gap-3">
          <div
            className="flex-1 flex items-center gap-2 bg-zinc-800/30 border border-zinc-700/40 rounded-xl px-3 py-2.5 min-h-[44px] cursor-text focus-within:ring-2 focus-within:ring-ia/30 focus-within:border-transparent transition-shadow"
            onClick={() => inputRef.current?.focus()}
          >
            <Sparkles className="w-4 h-4 text-zinc-600 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="urgente, vaga, boleto, contrato..."
              className="flex-1 min-w-[120px] bg-transparent text-[13px] text-white placeholder:text-zinc-600 outline-none"
            />
          </div>
          <button
            onClick={handleAddClick}
            disabled={!inputValue.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-ia hover:bg-ia/90 text-white text-[12px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        </div>

        {/* Managed keywords */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] text-zinc-400">
              {storeKeywords.length} palavra{storeKeywords.length !== 1 ? 's' : ''} ativa{storeKeywords.length !== 1 ? 's' : ''}
            </span>
            {storeKeywords.length > 0 && (
              <button
                onClick={clearAllKeywords}
                className="flex items-center gap-1 text-[11px] text-red-400/70 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
              >
                <Trash2 className="w-3 h-3" />
                Limpar todas
              </button>
            )}
          </div>

          {storeKeywords.length > 3 && (
            <div className="flex items-center gap-2 bg-zinc-800/30 border border-zinc-700/40 rounded-xl px-3 py-2 mb-3">
              <Filter className="w-3.5 h-3.5 text-zinc-600" />
              <input
                type="text"
                value={keywordFilter}
                onChange={(e) => setKeywordFilter(e.target.value)}
                placeholder="Filtrar palavras..."
                className="flex-1 bg-transparent text-[12px] text-white placeholder:text-zinc-600 outline-none"
              />
              {keywordFilter && (
                <button onClick={() => setKeywordFilter('')} className="p-0.5 rounded hover:bg-zinc-700 transition-colors">
                  <X className="w-3 h-3 text-zinc-500" />
                </button>
              )}
            </div>
          )}

          {storeKeywords.length === 0 ? (
            <div className="py-8 text-center rounded-xl border border-dashed border-zinc-800/60">
              <Search className="w-7 h-7 text-zinc-700 mx-auto mb-2" />
              <p className="text-[12px] text-zinc-500">Nenhuma palavra-chave configurada</p>
              <p className="text-[11px] text-zinc-600 mt-1">Adicione termos acima para personalizar a triagem inteligente</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ia/8 border border-ia/15 text-[12px] text-ia font-medium group hover:bg-ia/12 transition-colors"
                >
                  {kw}
                  <button
                    onClick={() => removeKeyword(kw)}
                    className="p-0.5 rounded text-ia/40 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {keywordFilter && filteredKeywords.length === 0 && storeKeywords.length > 0 && (
            <p className="text-[12px] text-zinc-500 text-center py-4">Nenhuma palavra encontrada para &ldquo;{keywordFilter}&rdquo;</p>
          )}
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader icon={Zap} title="Motor de Score" subtitle="Como a IA calcula a prioridade das suas tarefas." iconColor="text-amber-400" />
        <div className="space-y-3">
          {[
            { label: 'Palavra-chave do usuário encontrada', points: '+70', color: 'text-ia' },
            { label: 'Origem: GitHub', points: '+80', color: 'text-blue-400' },
            { label: 'Origem: Gmail', points: '+40', color: 'text-emerald-400' },
            { label: 'Título contém "urgente" ou "bug"', points: '+50', color: 'text-red-400' },
          ].map((rule) => (
            <div key={rule.label} className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/20">
              <span className="text-[12px] text-zinc-300">{rule.label}</span>
              <span className={`text-[12px] font-mono font-bold ${rule.color}`}>{rule.points}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Tab: Aparência ─────────────────────────────────────── */
  const renderAparencia = () => (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader icon={Palette} title="Tema" subtitle="Escolha o esquema de cores do aplicativo." iconColor="text-pink-400" />
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: 'dark', label: 'Escuro', icon: Moon, desc: 'Padrão' },
            { id: 'light', label: 'Claro', icon: Sun, desc: 'Alta visibilidade' },
            { id: 'system', label: 'Sistema', icon: Monitor, desc: 'Automático' },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                theme === t.id
                  ? 'bg-ia/5 border-ia/20 ring-1 ring-ia/10'
                  : 'bg-zinc-800/20 border-zinc-800/40 hover:border-zinc-700/50'
              }`}
            >
              <t.icon className={`w-5 h-5 ${theme === t.id ? 'text-ia' : 'text-zinc-500'}`} />
              <span className={`text-[12px] font-medium ${theme === t.id ? 'text-white' : 'text-zinc-400'}`}>{t.label}</span>
              <span className="text-[10px] text-zinc-600">{t.desc}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader icon={Eye} title="Acessibilidade" subtitle="Ajuste a experiência visual e motora." iconColor="text-sky-400" />
        <div className="divide-y divide-zinc-800/50">
          <SettingRow icon={Globe} label="Tamanho da fonte" desc={`${accessibility.fontSize}px`} iconColor="text-sky-400">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAccessibility('fontSize', Math.max(12, accessibility.fontSize - 1))}
                className="w-7 h-7 rounded-lg bg-zinc-800/50 border border-zinc-700/40 text-zinc-400 hover:text-white transition-colors flex items-center justify-center text-[13px] font-bold"
              >−</button>
              <span className="text-[12px] text-zinc-300 w-8 text-center font-mono">{accessibility.fontSize}</span>
              <button
                onClick={() => setAccessibility('fontSize', Math.min(22, accessibility.fontSize + 1))}
                className="w-7 h-7 rounded-lg bg-zinc-800/50 border border-zinc-700/40 text-zinc-400 hover:text-white transition-colors flex items-center justify-center text-[13px] font-bold"
              >+</button>
            </div>
          </SettingRow>
          <SettingRow icon={Eye} label="Alto contraste" desc="Melhora a legibilidade" iconColor="text-sky-400">
            <ToggleSwitch active={accessibility.highContrast} onChange={() => setAccessibility('highContrast', !accessibility.highContrast)} />
          </SettingRow>
          <SettingRow icon={Smartphone} label="Reduzir animações" desc="Menos transições e movimentos" iconColor="text-sky-400">
            <ToggleSwitch active={accessibility.reducedMotion} onChange={() => setAccessibility('reducedMotion', !accessibility.reducedMotion)} />
          </SettingRow>
          <SettingRow icon={Layout} label="Modo compacto" desc="Menos espaçamento entre elementos" iconColor="text-sky-400">
            <ToggleSwitch active={compactMode} onChange={() => setCompactMode(!compactMode)} />
          </SettingRow>
        </div>
      </SectionCard>
    </div>
  );

  /* ── Tab: Notificações ──────────────────────────────────── */
  const renderNotificacoes = () => (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader icon={Bell} title="Centro de Notificações" subtitle="Controle quais alertas você recebe e como." iconColor="text-amber-400" />
        <div className="divide-y divide-zinc-800/50">
          <SettingRow icon={Bell} label="Notificações habilitadas" desc="Receber alertas do sistema" iconColor="text-amber-400">
            <ToggleSwitch active={notifEnabled} onChange={() => setNotifEnabled(!notifEnabled)} />
          </SettingRow>
          <SettingRow icon={notifSound ? Volume2 : VolumeX} label="Sons de notificação" desc="Tocar som ao receber alerta" iconColor="text-amber-400">
            <ToggleSwitch active={notifSound} onChange={() => setNotifSound(!notifSound)} />
          </SettingRow>
          <SettingRow icon={AlertTriangle} label="Somente urgentes" desc="Mostrar apenas notificações de alta prioridade" iconColor="text-red-400">
            <ToggleSwitch active={notifUrgentOnly} onChange={() => setNotifUrgentOnly(!notifUrgentOnly)} />
          </SettingRow>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader icon={Info} title="Tipos de Alerta" subtitle="Ative ou desative categorias específicas." iconColor="text-blue-400" />
        <div className="divide-y divide-zinc-800/50">
          <SettingRow icon={Bell} label="Tarefas triadas" desc="Novas tarefas processadas pela IA" iconColor="text-blue-400">
            <ToggleSwitch active={notifTarefas} onChange={() => setNotifTarefas(!notifTarefas)} />
          </SettingRow>
          <SettingRow icon={Bell} label="Saúde & Hábitos" desc="Lembretes de medicamentos e metas" iconColor="text-blue-400">
            <ToggleSwitch active={notifSaude} onChange={() => setNotifSaude(!notifSaude)} />
          </SettingRow>
          <SettingRow icon={Bell} label="Financeiro" desc="Alertas de orçamento e vencimentos" iconColor="text-blue-400">
            <ToggleSwitch active={notifFinanceiro} onChange={() => setNotifFinanceiro(!notifFinanceiro)} />
          </SettingRow>
          <SettingRow icon={Bell} label="Sistema" desc="Atualizações e manutenção" iconColor="text-blue-400">
            <ToggleSwitch active={notifSistema} onChange={() => setNotifSistema(!notifSistema)} />
          </SettingRow>
        </div>
      </SectionCard>
    </div>
  );

  /* ── Tab: Segurança ─────────────────────────────────────── */
  const renderSeguranca = () => (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader icon={Shield} title="Autenticação" subtitle="Configurações de segurança da sua conta." iconColor="text-emerald-400" />
        <div className="divide-y divide-zinc-800/50">
          <SettingRow icon={Fingerprint} label="Autenticação de dois fatores" desc="Adicione uma camada extra de proteção" iconColor="text-emerald-400">
            <ToggleSwitch active={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
          </SettingRow>
          <SettingRow icon={Clock} label="Timeout da sessão" desc="Tempo antes do logout automático" iconColor="text-emerald-400">
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(Number(e.target.value))}
              className="bg-zinc-800/50 border border-zinc-700/40 rounded-lg px-3 py-1.5 text-[12px] text-white outline-none focus:ring-2 focus:ring-ia/30"
            >
              <option value={1}>1 hora</option>
              <option value={8}>8 horas</option>
              <option value={24}>24 horas</option>
              <option value={168}>7 dias</option>
            </select>
          </SettingRow>
          <SettingRow icon={KeyRound} label="Alterar senha" desc="Atualizar credenciais de acesso" iconColor="text-amber-400">
            <button className="text-[12px] text-ia hover:text-ia/80 font-medium transition-colors">Alterar</button>
          </SettingRow>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader icon={Shield} title="Criptografia & Dados" subtitle="Informações sobre a proteção dos seus dados." iconColor="text-cyan-400" />
        <div className="space-y-3">
          {[
            { label: 'Senhas', value: 'bcrypt (cost 12)', icon: '🔒' },
            { label: 'Tokens de integração', value: 'Fernet AES-256', icon: '🛡️' },
            { label: 'Sessões', value: 'JWT HS256 (24h)', icon: '🔑' },
            { label: 'Integridade financeira', value: 'SHA-256 + salt', icon: '✅' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-zinc-800/20 border border-zinc-800/40">
              <div className="flex items-center gap-3">
                <span className="text-[14px]">{item.icon}</span>
                <span className="text-[12px] text-zinc-300">{item.label}</span>
              </div>
              <span className="text-[11px] text-emerald-400/80 font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="border-red-900/30">
        <SectionHeader icon={AlertTriangle} title="Zona de Perigo" subtitle="Ações irreversíveis para sua conta." iconColor="text-red-400" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-zinc-300">Excluir minha conta</p>
            <p className="text-[11px] text-zinc-600">Todos os dados serão removidos permanentemente</p>
          </div>
          <button className="px-4 py-2 rounded-xl border border-red-500/30 text-[12px] text-red-400 font-medium hover:bg-red-500/10 transition-colors">
            Excluir conta
          </button>
        </div>
      </SectionCard>
    </div>
  );

  const TAB_RENDERERS: Record<SettingsTab, () => React.ReactNode> = {
    geral: renderGeral,
    ia: renderIA,
    aparencia: renderAparencia,
    notificacoes: renderNotificacoes,
    seguranca: renderSeguranca,
  };

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Preferências</h1>
        <p className="text-sm text-zinc-500 mt-1">Configure sua experiência no Simply-Life</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar tabs */}
        <nav className="w-56 shrink-0 space-y-1 sticky top-4 self-start">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all ${
                  active
                    ? 'bg-zinc-800/50 border border-zinc-700/40'
                    : 'hover:bg-zinc-800/25 border border-transparent'
                }`}
              >
                <tab.icon className={`w-[18px] h-[18px] ${active ? 'text-ia' : 'text-zinc-500'}`} />
                <div className="min-w-0">
                  <p className={`text-[13px] font-medium ${active ? 'text-white' : 'text-zinc-400'}`}>{tab.label}</p>
                  <p className="text-[10px] text-zinc-600 truncate">{tab.description}</p>
                </div>
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-zinc-800/50">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-ia hover:bg-ia/90 text-white rounded-xl px-4 py-2.5 text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </nav>

        {/* Content area */}
        <main className="flex-1 min-w-0">
          {TAB_RENDERERS[activeTab]()}
        </main>
      </div>
    </div>
  );
}
