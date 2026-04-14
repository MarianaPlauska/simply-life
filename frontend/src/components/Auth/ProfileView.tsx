import { useState } from 'react';
import { User, Mail, Camera, Shield, Bell, Moon, Keyboard, Monitor, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';

export function ProfileView() {
  const userProfile = useTaskStore((s) => s.userProfile);
  const updateProfile = useTaskStore((s) => s.updateProfile);
  const logout = useTaskStore((s) => s.logout);

  const [nome, setNome] = useState(userProfile.nome);
  const [email, setEmail] = useState(userProfile.email);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateProfile({ nome, email });
    setSaved(true);
    toast.success('Perfil atualizado');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto pb-16 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Meu Perfil</h1>
        <p className="text-[13px] text-zinc-500 mt-1">Gerencie suas informacoes pessoais e preferencias</p>
      </div>

      {/* Avatar + Name */}
      <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700/50 flex items-center justify-center">
              <User className="w-8 h-8 text-zinc-500" aria-hidden="true" />
            </div>
            <button
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-zinc-800 border border-zinc-700/50 text-zinc-400 hover:text-white transition-colors"
              aria-label="Alterar foto de perfil"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">{userProfile.nome || 'Usuario'}</h2>
            <p className="text-[13px] text-zinc-500">{userProfile.email || 'email@exemplo.com'}</p>
          </div>
        </div>
      </section>

      {/* Edit Fields */}
      <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-6 space-y-5">
        <h3 className="text-[13px] font-semibold text-zinc-200 flex items-center gap-2">
          <Shield className="w-4 h-4 text-zinc-500" aria-hidden="true" />
          Informacoes da Conta
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-nome" className="block text-[12px] font-medium text-zinc-400 mb-1.5">Nome</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" aria-hidden="true" />
              <input
                id="profile-nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-zinc-800/40 border border-zinc-700/40 rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-violet-500/30 transition"
              />
            </div>
          </div>
          <div>
            <label htmlFor="profile-email" className="block text-[12px] font-medium text-zinc-400 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" aria-hidden="true" />
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800/40 border border-zinc-700/40 rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-violet-500/30 transition"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? 'Salvo!' : 'Salvar alteracoes'}
        </button>
      </section>

      {/* Quick Preferences */}
      <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-6 space-y-4">
        <h3 className="text-[13px] font-semibold text-zinc-200">Preferencias Rapidas</h3>
        <div className="space-y-0 divide-y divide-zinc-800/30">
          <PreferenceRow icon={Bell} label="Notificacoes" description="Alertas de tarefas e lembretes" />
          <PreferenceRow icon={Moon} label="Modo Escuro" description="Sempre ativo neste tema" defaultOn />
          <PreferenceRow icon={Keyboard} label="Atalhos de Teclado" description="Ctrl+K busca, Ctrl+N nova nota" defaultOn />
          <PreferenceRow icon={Monitor} label="Animacoes Reduzidas" description="Reduz movimentos para acessibilidade" />
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-red-900/30 bg-red-500/[0.02] p-6">
        <h3 className="text-[13px] font-semibold text-red-400 mb-3">Zona de Perigo</h3>
        <button
          onClick={logout}
          className="px-4 py-2 text-[12px] font-medium text-red-400 border border-red-800/40 rounded-lg hover:bg-red-500/10 transition-colors"
        >
          Sair da Conta
        </button>
      </section>
    </div>
  );
}

function PreferenceRow({
  icon: Icon,
  label,
  description,
  defaultOn = false,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  defaultOn?: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3.5">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-zinc-500" aria-hidden="true" />
        <div>
          <p className="text-[13px] font-medium text-zinc-200">{label}</p>
          <p className="text-[11px] text-zinc-600">{description}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        aria-label={`${label}: ${enabled ? 'ativado' : 'desativado'}`}
        onClick={() => setEnabled((v) => !v)}
        className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-violet-500' : 'bg-zinc-700'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
