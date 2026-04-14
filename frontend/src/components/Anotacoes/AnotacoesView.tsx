import { useEffect, useState, useMemo } from 'react';
import {
  Plus, FileText, Pin, Search, AlignLeft, Trash2, X,
  Briefcase, User, Lightbulb, HeartPulse, BookOpen, Maximize2,
} from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';

/* -- Category system -- */
const CATEGORIAS = [
  { id: 'all', label: 'Todas', icon: BookOpen, text: 'text-zinc-400', bg: 'bg-zinc-500/10' },
  { id: 'trabalho', label: 'Trabalho', icon: Briefcase, text: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'pessoal', label: 'Pessoal', icon: User, text: 'text-violet-400', bg: 'bg-violet-500/10' },
  { id: 'ideias', label: 'Ideias', icon: Lightbulb, text: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'saude', label: 'Saúde', icon: HeartPulse, text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
] as const;

const CAT_MAP = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c]));

export function AnotacoesView() {
  const anotacoes = useTaskStore((s) => s.anotacoes);
  const fetchAnotacoes = useTaskStore((s) => s.fetchAnotacoes);
  const setQuickCaptureOpen = useTaskStore((s) => s.setQuickCaptureOpen);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => { fetchAnotacoes(); }, [fetchAnotacoes]);

  useEffect(() => {
    if (anotacoes.length > 0 && selectedId === null) {
      setSelectedId(anotacoes[0].id);
    }
  }, [anotacoes, selectedId]);

  const filteredNotes = useMemo(() => {
    let notes = anotacoes;
    if (activeCategory !== 'all') {
      notes = notes.filter((n) => (n.categoria || 'pessoal') === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      notes = notes.filter(
        (n) =>
          n.titulo?.toLowerCase().includes(q) ||
          n.conteudo.toLowerCase().includes(q)
      );
    }
    return [...notes].sort((a, b) => (b.fixado || 0) - (a.fixado || 0));
  }, [anotacoes, activeCategory, searchQuery]);

  const selectedNote = anotacoes.find((n) => n.id === selectedId);
  const wordCount = selectedNote ? selectedNote.conteudo.split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const noteCat = CAT_MAP[selectedNote?.categoria || 'pessoal'] || CAT_MAP['pessoal'];
  const NoteCatIcon = noteCat.icon;

  return (
    <>
      <div className="flex h-[calc(100vh-7rem)] max-w-7xl mx-auto gap-0 rounded-xl border border-zinc-800/40 overflow-hidden" role="region" aria-label="Segundo Cérebro">

        {/* Left Sidebar */}
        <aside className="w-72 shrink-0 bg-zinc-900/30 border-r border-zinc-800/30 flex flex-col" aria-label="Lista de anotações">
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-zinc-200">Segundo Cérebro</h2>
              <button
                onClick={() => setQuickCaptureOpen(true)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Nova anotação"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" aria-hidden="true" />
              <input
                type="text"
                placeholder="Buscar notas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-800/40 border border-zinc-800/50 rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-zinc-300 placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-zinc-700 transition"
                aria-label="Buscar anotações"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 flex-wrap">
              {CATEGORIAS.map((cat) => {
                const CIcon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${isActive ? `${cat.bg} ${cat.text}` : 'text-zinc-600 hover:text-zinc-400'}`}
                  >
                    <CIcon className="w-3 h-3" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note List */}
          <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5" aria-label="Notas recentes">
            {filteredNotes.length === 0 && (
              <p className="text-[12px] text-zinc-600 text-center py-8">Nenhuma anotação encontrada</p>
            )}
            {filteredNotes.map((nota) => {
              const isActive = selectedId === nota.id;
              const cat = CAT_MAP[nota.categoria || 'pessoal'] || CAT_MAP['pessoal'];
              const CatIcon = cat.icon;
              return (
                <button
                  key={nota.id}
                  onClick={() => setSelectedId(nota.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group ${isActive ? 'bg-zinc-800/60 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <CatIcon className={`w-3.5 h-3.5 shrink-0 ${cat.text}`} aria-hidden="true" />
                    <span className="text-[12px] font-medium truncate flex-1">
                      {nota.titulo || 'Sem título'}
                    </span>
                    {nota.fixado === 1 && (
                      <Pin className="w-3 h-3 text-amber-400 shrink-0" aria-label="Fixada" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-600 line-clamp-1 ml-[22px]">
                    {nota.conteudo}
                  </p>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="px-4 py-3 border-t border-zinc-800/30">
            <p className="text-[10px] text-zinc-600 text-center">
              {filteredNotes.length} nota{filteredNotes.length !== 1 ? 's' : ''} {activeCategory !== 'all' ? `em ${CAT_MAP[activeCategory]?.label}` : ''}
            </p>
          </div>
        </aside>

        {/* Right Canvas */}
        <main className="flex-1 flex flex-col bg-zinc-950/40 min-w-0" aria-label="Conteúdo da anotação">
          {selectedNote ? (
            <>
              <header className="px-10 pt-10 pb-2 border-b border-zinc-800/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
                      {selectedNote.titulo || 'Sem título'}
                    </h1>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-600">
                      <span className={`flex items-center gap-1 ${noteCat.text}`}>
                        <NoteCatIcon className="w-3 h-3" aria-hidden="true" />
                        {noteCat.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <AlignLeft className="w-3 h-3" aria-hidden="true" />
                        {wordCount} palavras
                      </span>
                      <span>~{readTime} min de leitura</span>
                      <span>Nota #{selectedNote.id}</span>
                      {selectedNote.fixado === 1 && (
                        <span className="flex items-center gap-1 text-amber-500">
                          <Pin className="w-3 h-3" aria-hidden="true" />
                          Fixada
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFocusMode(true)}
                      className="p-2 rounded-lg text-zinc-600 hover:text-violet-400 hover:bg-zinc-800/40 transition-colors"
                      aria-label="Leitura focada"
                      title="Leitura Focada"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-zinc-800/40 transition-colors"
                      aria-label="Excluir anotação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-10 py-8">
                <article className="max-w-2xl">
                  <p className="text-[15px] leading-[1.8] text-zinc-300 whitespace-pre-wrap selection:bg-violet-500/20">
                    {selectedNote.conteudo}
                  </p>
                </article>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="p-4 rounded-2xl bg-zinc-800/30 border border-zinc-800/40">
                <FileText className="w-8 h-8 text-zinc-600" aria-hidden="true" />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-medium text-zinc-400">Nenhuma nota selecionada</p>
                <p className="text-[12px] text-zinc-600 mt-1">Selecione uma nota ou crie uma nova</p>
              </div>
              <button
                onClick={() => setQuickCaptureOpen(true)}
                className="mt-2 px-4 py-2 text-[12px] font-medium text-zinc-300 bg-zinc-800/50 border border-zinc-700/40 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Nova Anotação
                </span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Leitura Focada Modal */}
      {focusMode && selectedNote && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center" onClick={() => setFocusMode(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-8 py-5">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">{selectedNote.titulo || 'Sem título'}</h2>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-500">
                  <span className={`flex items-center gap-1 ${noteCat.text}`}>
                    <NoteCatIcon className="w-3 h-3" />
                    {noteCat.label}
                  </span>
                  <span>{wordCount} palavras</span>
                  <span>~{readTime} min</span>
                </div>
              </div>
              <button
                onClick={() => setFocusMode(false)}
                className="p-2 rounded-xl hover:bg-zinc-800/60 text-zinc-500 hover:text-white transition-colors"
                aria-label="Fechar leitura focada"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-10">
              <article className="prose prose-invert prose-lg max-w-none">
                <p className="text-[17px] leading-[2] text-zinc-200 whitespace-pre-wrap font-[Georgia,_serif] selection:bg-violet-500/30">
                  {selectedNote.conteudo}
                </p>
              </article>
            </div>

            <div className="px-8 py-4 border-t border-zinc-800/30 flex items-center justify-center gap-6 text-[11px] text-zinc-600">
              <span>Leitura Focada</span>
              <span>Pressione <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-mono text-zinc-400">Esc</kbd> para sair</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
