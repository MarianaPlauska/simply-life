import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus, FileText, Pin, Search, Trash2, ArrowLeft,
  BookOpen, Bell, ListChecks, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import type { AnotacaoTipo } from '../../store/slices/anotacoesSlice'
import { AXEL_PAGE_GUTTER, AXEL_PAGE_SHELL, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import { EmptyState } from '../ui/EmptyState'
import { PageIntro } from '../layout/PageIntro'
import { NotesMoodStrip } from './NotesMoodStrip'
import {
  isChecklistNote,
  parseChecklist,
  plainTextPreview,
  toggleChecklistLine,
} from '../../lib/noteChecklist'

const CATEGORIAS = [
  { id: 'all', label: 'Todas', icon: BookOpen },
  { id: 'diario', label: 'Diário', icon: BookOpen },
  { id: 'lembrete', label: 'Lembretes', icon: Bell },
  { id: 'lista', label: 'Listas', icon: ListChecks },
] as const

function normalizarCategoria(raw?: string | null): AnotacaoTipo
{
  if (raw === 'lembrete' || raw === 'lista' || raw === 'diario')
  {
    return raw
  }
  return 'diario'
}

const CAT_MAP = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c]))

export function AnotacoesView()
{
  const anotacoes = useTaskStore((s) => s.anotacoes)
  const fetchAnotacoes = useTaskStore((s) => s.fetchAnotacoes)
  const createAnotacao = useTaskStore((s) => s.createAnotacao)
  const updateAnotacao = useTaskStore((s) => s.updateAnotacao)
  const deleteAnotacao = useTaskStore((s) => s.deleteAnotacao)
  const togglePinAnotacao = useTaskStore((s) => s.togglePinAnotacao)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [mobileEditor, setMobileEditor] = useState(false)
  const [draftTitulo, setDraftTitulo] = useState('')
  const [draftConteudo, setDraftConteudo] = useState('')
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() =>
  {
    void fetchAnotacoes()
  }, [fetchAnotacoes])

  const selectedNote = anotacoes.find((n) => n.id === selectedId) ?? null

  useEffect(() =>
  {
    if (!selectedNote)
    {
      setDraftTitulo('')
      setDraftConteudo('')
      return
    }
    setDraftTitulo(selectedNote.titulo ?? '')
    setDraftConteudo(selectedNote.conteudo ?? '')
  }, [selectedNote?.id, selectedNote?.titulo, selectedNote?.conteudo])

  const filteredNotes = useMemo(() =>
  {
    let notes = anotacoes
    if (activeCategory !== 'all')
    {
      notes = notes.filter((n) => normalizarCategoria(n.categoria) === activeCategory)
    }
    if (searchQuery.trim())
    {
      const q = searchQuery.toLowerCase()
      notes = notes.filter(
        (n) =>
          n.titulo?.toLowerCase().includes(q)
          || n.conteudo.toLowerCase().includes(q),
      )
    }
    return [...notes].sort((a, b) => (b.fixado || 0) - (a.fixado || 0))
  }, [anotacoes, activeCategory, searchQuery])

  const scheduleSave = useCallback((id: number, titulo: string, conteudo: string) =>
  {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() =>
    {
      setSaving(true)
      void updateAnotacao(id, { titulo: titulo || null, conteudo })
        .catch(() => toast.error('Erro ao salvar nota'))
        .finally(() => setSaving(false))
    }, 550)
  }, [updateAnotacao])

  const handleTituloChange = (value: string) =>
  {
    setDraftTitulo(value)
    if (selectedId) scheduleSave(selectedId, value, draftConteudo)
  }

  const handleConteudoChange = (value: string) =>
  {
    setDraftConteudo(value)
    if (selectedId) scheduleSave(selectedId, draftTitulo, value)
  }

  const handleNewNote = async (tipo: AnotacaoTipo = 'diario') =>
  {
    try
    {
      const note = await createAnotacao(tipo)
      if (!note) return
      setSelectedId(note.id)
      setMobileEditor(true)
    }
    catch
    {
      toast.error('Não foi possível criar a nota')
    }
  }

  const handleDelete = async () =>
  {
    if (!selectedId) return
    if (!window.confirm('Excluir esta anotação?')) return
    try
    {
      await deleteAnotacao(selectedId)
      setSelectedId(filteredNotes.find((n) => n.id !== selectedId)?.id ?? null)
      setMobileEditor(false)
      toast.success('Anotação excluída')
    }
    catch
    {
      toast.error('Erro ao excluir')
    }
  }

  const selectNote = (id: number) =>
  {
    setSelectedId(id)
    setMobileEditor(true)
  }

  const checklistMode = selectedNote
    ? isChecklistNote(normalizarCategoria(selectedNote.categoria), draftConteudo)
    : false

  return (
    <div className={`${AXEL_PAGE_SHELL} ${AXEL_PAGE_GUTTER} pb-16`}>
      <PageIntro
        title="Anotações"
        lede="Diário, listas e lembretes - rápido como papel."
      />

      <div className="mt-4">
        <NotesMoodStrip />
      </div>

      <div className="mt-3 sm:mt-4 flex flex-col md:flex-row gap-0 md:gap-3 min-h-[min(70dvh,640px)] rounded-sl border border-line overflow-hidden bg-card">
        {/* Lista */}
        <aside
          className={`md:w-72 lg:w-80 shrink-0 border-b md:border-b-0 md:border-r border-line flex flex-col bg-chrome/20 ${
            mobileEditor ? 'hidden md:flex' : 'flex'
          }`}
          aria-label="Lista de anotações"
        >
          <div className="p-3 border-b border-line space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase text-ink-muted">Suas notas</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => void handleNewNote('lista')}
                  className="p-2 rounded-sl text-ink-muted hover:text-accent hover:bg-chrome border border-transparent hover:border-line"
                  aria-label="Nova lista"
                  title="Nova lista"
                >
                  <ListChecks className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleNewNote('diario')}
                  className="p-2 rounded-sl bg-ink text-fundo hover:opacity-90"
                  aria-label="Nova anotação"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" aria-hidden />
              <input
                type="search"
                placeholder="Buscar…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-line rounded-sl pl-8 pr-3 py-2 text-[12px] text-ink placeholder:text-ink-muted outline-none focus:border-accent/40"
              />
            </div>

            <div className="flex gap-1 flex-wrap">
              {CATEGORIAS.map((cat) =>
              {
                const CIcon = cat.icon
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-sl text-[10px] font-medium border transition-colors ${
                      isActive
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-line text-ink-muted hover:text-ink'
                    }`}
                  >
                    <CIcon className="w-3 h-3" />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
            {filteredNotes.length === 0 && (
              <EmptyState
                icon={FileText}
                title="Nenhuma anotação"
                description="Capture ideias, listas de compras ou reflexões do dia."
                actionLabel="Nova nota"
                onAction={() => void handleNewNote('diario')}
              />
            )}
            {filteredNotes.map((nota) =>
            {
              const isActive = selectedId === nota.id
              const cat = CAT_MAP[normalizarCategoria(nota.categoria)] || CAT_MAP.diario
              const CatIcon = cat.icon
              return (
                <button
                  key={nota.id}
                  type="button"
                  onClick={() => selectNote(nota.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-sl transition-colors ${
                    isActive
                      ? 'bg-accent/10 border border-accent/30 text-ink'
                      : 'text-ink-muted hover:text-ink hover:bg-chrome/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <CatIcon className="w-3.5 h-3.5 shrink-0 text-accent" aria-hidden />
                    <span className="text-[12px] font-medium truncate flex-1">
                      {nota.titulo || 'Sem título'}
                    </span>
                    {nota.fixado === 1 && (
                      <Pin className="w-3 h-3 text-accent shrink-0" aria-label="Fixada" />
                    )}
                  </div>
                  <p className="text-[11px] text-ink-muted line-clamp-1 ml-[22px]">
                    {plainTextPreview(nota.conteudo) || 'Vazio'}
                  </p>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Editor */}
        <main
          className={`flex-1 flex flex-col min-w-0 min-h-[320px] ${
            mobileEditor ? 'flex' : 'hidden md:flex'
          }`}
          aria-label="Editor de anotação"
        >
          {selectedNote ? (
            <>
              <header className="px-3 sm:px-5 py-3 border-b border-line flex items-start gap-2">
                <button
                  type="button"
                  className="md:hidden p-2 -ml-1 rounded-sl text-ink-muted hover:text-ink"
                  onClick={() => setMobileEditor(false)}
                  aria-label="Voltar à lista"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0 space-y-1">
                  <input
                    type="text"
                    value={draftTitulo}
                    onChange={(e) => handleTituloChange(e.target.value)}
                    placeholder="Título"
                    className="w-full bg-transparent text-lg font-display text-ink outline-none placeholder:text-ink-muted"
                  />
                  <div className="flex items-center gap-2 text-[10px] font-mono text-ink-muted">
                    <span>{CAT_MAP[normalizarCategoria(selectedNote.categoria)]?.label}</span>
                    {saving && (
                      <span className="inline-flex items-center gap-1 text-accent">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Salvando
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => void togglePinAnotacao(selectedNote.id)}
                    className={`p-2 rounded-sl border transition-colors ${
                      selectedNote.fixado === 1
                        ? 'border-accent text-accent bg-accent/10'
                        : 'border-line text-ink-muted hover:text-ink'
                    }`}
                    aria-label="Fixar nota"
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    className="p-2 rounded-sl border border-line text-ink-muted hover:text-urgente hover:border-urgente/40"
                    aria-label="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-3 sm:p-5 custom-scrollbar">
                {checklistMode ? (
                  <ul className="space-y-2 max-w-xl">
                    {parseChecklist(draftConteudo).map((line, idx) =>
                    {
                      if (!line.text && !line.raw.trim()) return null
                      return (
                        <li key={idx} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={line.checked}
                            onChange={() =>
                            {
                              const next = toggleChecklistLine(draftConteudo, idx)
                              handleConteudoChange(next)
                            }}
                            className="mt-1 w-4 h-4 rounded border-line accent-accent"
                          />
                          <span className={`text-[14px] flex-1 ${line.checked ? 'line-through text-ink-muted' : 'text-ink'}`}>
                            {line.text || line.raw}
                          </span>
                        </li>
                      )
                    })}
                    <li>
                      <button
                        type="button"
                        onClick={() => handleConteudoChange(`${draftConteudo.trimEnd()}\n- [ ] `)}
                        className="text-[12px] font-mono uppercase text-accent hover:underline mt-2"
                      >
                        + Item
                      </button>
                    </li>
                  </ul>
                ) : (
                  <textarea
                    value={draftConteudo}
                    onChange={(e) => handleConteudoChange(e.target.value)}
                    placeholder="Escreva livremente: diário, ideias, reflexões…"
                    className="w-full min-h-[min(50dvh,400px)] bg-transparent text-[15px] leading-relaxed text-ink outline-none resize-none placeholder:text-ink-muted"
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <FileText className="w-10 h-10 text-ink-muted" aria-hidden />
              <p className={`text-[14px] ${AXEL_TEXT_SECONDARY}`}>Selecione ou crie uma nota</p>
              <button
                type="button"
                onClick={() => void handleNewNote('diario')}
                className="px-4 py-2 min-h-11 rounded-sl bg-ink text-fundo font-mono text-[10px] uppercase"
              >
                Nova anotação
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
