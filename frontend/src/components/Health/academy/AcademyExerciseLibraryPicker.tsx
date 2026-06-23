import { useMemo, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  ACADEMY_GRUPOS,
  createCustomLibraryExercise,
  libraryToAcademyExercise,
  searchExerciseLibrary,
  type LibraryExercise,
} from '../../../lib/academyExerciseLibrary'
import type { AcademyExercise } from '../../../lib/academyWorkouts'

interface AcademyExerciseLibraryPickerProps
{
  customLibrary: LibraryExercise[]
  onAdd: (exercise: AcademyExercise) => void
  onSaveCustom: (exercise: LibraryExercise) => void
}

export function AcademyExerciseLibraryPicker({
  customLibrary,
  onAdd,
  onSaveCustom,
}: AcademyExerciseLibraryPickerProps)
{
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [novoNome, setNovoNome] = useState('')
  const [novoGrupo, setNovoGrupo] = useState<string>(ACADEMY_GRUPOS[0])

  const resultados = useMemo(
    () => searchExerciseLibrary(busca, customLibrary),
    [busca, customLibrary],
  )

  const adicionarDaBiblioteca = (lib: LibraryExercise) =>
  {
    onAdd(libraryToAcademyExercise(lib))
    toast.success(`${lib.nome} adicionado ao treino`)
    setAberto(false)
    setBusca('')
  }

  const criarCustom = () =>
  {
    const nome = novoNome.trim()
    if (!nome)
    {
      return
    }
    const custom = createCustomLibraryExercise(nome, novoGrupo)
    onSaveCustom(custom)
    onAdd(libraryToAcademyExercise(custom))
    toast.success('Exercício customizado criado')
    setNovoNome('')
    setAberto(false)
  }

  if (!aberto)
  {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="w-full py-2.5 rounded-sl border border-dashed border-line text-[11px] font-mono uppercase text-ink-muted hover:text-ink hover:border-accent/40 transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        Biblioteca de exercícios
      </button>
    )
  }

  return (
    <div className="rounded-sl border border-line bg-chrome p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0 rounded-sl border border-line bg-card px-2.5 py-2">
          <Search className="w-3.5 h-3.5 text-ink-muted shrink-0" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar exercício..."
            className="flex-1 min-w-0 bg-transparent text-[13px] text-ink outline-none"
            autoFocus
          />
        </div>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="p-2 rounded-sl border border-line text-ink-muted hover:text-ink"
          aria-label="Fechar biblioteca"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <ul className="max-h-44 overflow-y-auto divide-y divide-line rounded-sl border border-line bg-card">
        {resultados.map((lib) => (
          <li key={lib.id}>
            <button
              type="button"
              onClick={() => adicionarDaBiblioteca(lib)}
              className="w-full px-3 py-2.5 text-left hover:bg-accent-muted/30 transition-colors"
            >
              <p className="text-[13px] font-medium text-ink">{lib.nome}</p>
              <p className="text-[10px] text-ink-muted font-mono uppercase mt-0.5">
                {lib.grupo}{lib.equipamento ? ` · ${lib.equipamento}` : ''}
              </p>
            </button>
          </li>
        ))}
      </ul>

      <div className="pt-2 border-t border-line space-y-2">
        <p className="text-[10px] font-mono uppercase text-ink-muted">Criar customizado</p>
        <input
          type="text"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          placeholder="Nome do exercício"
          className="w-full px-3 py-2 rounded-sl border border-line bg-card text-[13px] text-ink outline-none"
        />
        <select
          value={novoGrupo}
          onChange={(e) => setNovoGrupo(e.target.value)}
          className="w-full px-3 py-2 rounded-sl border border-line bg-card text-[12px] text-ink outline-none"
        >
          {ACADEMY_GRUPOS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={criarCustom}
          disabled={!novoNome.trim()}
          className="w-full py-2 rounded-sl bg-accent/15 border border-accent/30 text-[11px] font-mono uppercase text-ink disabled:opacity-40"
        >
          Adicionar customizado
        </button>
      </div>
    </div>
  )
}
