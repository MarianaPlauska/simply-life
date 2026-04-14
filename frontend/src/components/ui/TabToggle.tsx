/**
 * ui/TabToggle.tsx — Alternador de abas (login/register) sem lógica de negócio
 */
interface Tab<T extends string> {
  value: T;
  label: string;
}

interface TabToggleProps<T extends string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (value: T) => void;
}

export function TabToggle<T extends string>({ tabs, active, onChange }: TabToggleProps<T>) {
  return (
    <div className="flex bg-zinc-950/60 rounded-xl p-1 mb-7 border border-white/[0.04]">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-300 ${
            active === tab.value
              ? 'bg-zinc-800/80 text-white shadow-md shadow-black/30'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
