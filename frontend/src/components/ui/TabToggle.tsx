/**
 * ui/TabToggle.tsx - Alternador de abas (login/register) sem lógica de negócio
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
    <div className="flex border border-line rounded-sl p-0.5 mb-7 bg-chrome">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`flex-1 py-2.5 rounded-sl text-[13px] font-medium transition-colors ${
            active === tab.value
              ? 'bg-card text-ink border border-line'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
