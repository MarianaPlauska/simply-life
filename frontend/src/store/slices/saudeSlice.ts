// slice de saúde — medicamentos, hábitos, treinos, streaks via supabase
import type { StateCreator } from 'zustand'
import type { Medicamento, MedicamentoTomada, HabitoDiario, HabitoDiarioConfig, SessaoTreino } from '../storeTypes'
import type { HabitoStreak } from '../../types'
import { supabase } from '../../lib/supabase'
import { isWorkoutComplete, minutesBetween } from '../../utils/workoutCompletion'
import {
  configAposResetDiario,
  habitoPrecisaReset,
  isNovoDiaDeSaude,
  isPhantomHabitId,
  localTodayIso,
  mergeHabitosAfterFetch,
  readCachedWaterEntries,
  writeCachedWaterEntries,
  writeStoredHealthDay,
} from '../../lib/healthDayBoundary'
import { persistLocalMlPorCopo, persistLocalWaterPrefs } from '../../lib/waterHydration'
import { upsertHabitHistorico } from '../../lib/habitHistorico'
import {
  appendHistoricoCarga,
  mergeAcademyConfig,
  type AcademyTreinoConfig,
} from '../../lib/academyWorkouts'
import {
  buildAcademySessionDetail,
  parseAcademySessionDetail,
  type FinalizarTreinoPayload,
} from '../../lib/academySessionDetail'
import { TREINO_PRESET } from '../../constants/healthPresets'
import {
  medicamentoCompletoHoje,
  tomadaParaDose,
} from '../../lib/medicamentosSchedule'

function mapMedicamento(
  row: Record<string, unknown>,
  tomadas: MedicamentoTomada[],
  today: string,
): Medicamento
{
  const cfg = row.config
  const med: Medicamento = {
    id: row.id as number,
    nome: String(row.nome ?? ''),
    horario: String(row.horario ?? ''),
    config: (typeof cfg === 'object' && cfg !== null ? cfg : {}) as Medicamento['config'],
    tomado: false,
  }
  med.tomado = medicamentoCompletoHoje(med, tomadas, today)
  return med
}

function mapHabito(row: Record<string, unknown>): HabitoDiario
{
  const cfg = row.config
  return {
    id: row.id as number,
    tipo: String(row.tipo ?? 'customizado'),
    nome_exibicao: String(row.nome_exibicao ?? ''),
    meta_diaria: Number(row.meta_diaria ?? 0),
    progresso_atual: Number(row.progresso_atual ?? 0),
    unidade: String(row.unidade ?? 'un'),
    config: (typeof cfg === 'object' && cfg !== null ? cfg : {}) as HabitoDiarioConfig,
  }
}

function mapSessao(row: Record<string, unknown>): SessaoTreino
{
  const detalheRaw = row.detalhe
  const detalhe = detalheRaw && typeof detalheRaw === 'object'
    ? parseAcademySessionDetail(detalheRaw)
    : null

  return {
    id: row.id as number,
    habito_id: row.habito_id != null ? Number(row.habito_id) : null,
    tipo_treino: String(row.tipo_treino ?? ''),
    meta_minutos: Number(row.meta_minutos ?? 30),
    iniciado_em: String(row.iniciado_em ?? ''),
    finalizado_em: row.finalizado_em ? String(row.finalizado_em) : null,
    duracao_real_min: row.duracao_real_min != null ? Number(row.duracao_real_min) : null,
    concluido: Boolean(row.concluido),
    treino_codigo: row.treino_codigo != null ? String(row.treino_codigo) : null,
    volume_kg: row.volume_kg != null ? Number(row.volume_kg) : null,
    detalhe,
  }
}

async function ensureTreinoRecord(get: () => SaudeSlice): Promise<HabitoDiario | null>
{
  const existente = get().habitos.find((h) => h.tipo === 'treino')
  if (existente && !isPhantomHabitId(existente.id))
  {
    return existente
  }
  await get().ensureHealthHabit(TREINO_PRESET)
  return get().habitos.find((h) => h.tipo === 'treino') ?? null
}

export interface SaudeSlice
{
  medicamentos: Medicamento[]
  medicamentoTomadas: MedicamentoTomada[]
  habitos: HabitoDiario[]
  habitosStreaks: HabitoStreak[]
  sessaoTreinoAtiva: SessaoTreino | null
  sessoesTreinoHoje: SessaoTreino[]
  sessoesTreinoMes: SessaoTreino[]
  sessoesTreinoAnalytics: SessaoTreino[]
  fetchMedicamentos: () => Promise<void>
  fetchMedicamentoTomadas: () => Promise<void>
  addMedicamento: (med: {
    nome: string
    horario: string
    horarios?: string[]
    config?: import('../storeTypes').MedicamentoConfig
  }) => Promise<void>
  addMedicamentosBulk: (items: {
    nome: string
    horario: string
    horarios?: string[]
    config?: import('../storeTypes').MedicamentoConfig
  }[]) => Promise<number>
  removeMedicamento: (id: number) => Promise<void>
  removeMedicamentosBulk: (ids: number[]) => Promise<void>
  toggleMedicamento: (id: number) => Promise<void>
  registrarTomadaMedicamento: (medicamentoId: number, horarioPrevisto: string) => Promise<void>
  updateTreinoPlanoSemana: (plano: HabitoDiarioConfig['plano_semana']) => Promise<void>
  updateAcademyTreinoConfig: (patch: Partial<AcademyTreinoConfig>) => Promise<void>
  registrarSerieAcademia: (exercicioId: string, pesoKg: number, reps: number) => Promise<void>
  fetchHabitos: () => Promise<void>
  addHabito: (h: {
    tipo: string
    nome_exibicao: string
    meta_diaria: number
    unidade: string
    config?: HabitoDiarioConfig
  }) => Promise<void>
  ensureHealthHabit: (preset: {
    tipo: string
    nome_exibicao: string
    meta_diaria: number
    unidade: string
    config?: HabitoDiarioConfig
  }) => Promise<HabitoDiario | null>
  updateHabitoMeta: (id: number, meta_diaria: number) => Promise<void>
  incrementHabito: (id: number) => Promise<void>
  incrementHabitoBy: (id: number, delta: number) => Promise<void>
  decrementHabito: (id: number) => Promise<void>
  setHabitoProgress: (id: number, progresso_atual: number) => Promise<void>
  updateHabitoConfig: (id: number, patch: HabitoDiarioConfig) => Promise<void>
  setAguaRegistros: (id: number, registros_ml: number[]) => Promise<void>
  deleteHabito: (id: number) => Promise<void>
  fetchHabitosStreaks: () => Promise<void>
  fetchSessaoTreinoAtiva: () => Promise<void>
  fetchSessoesTreinoHoje: () => Promise<void>
  fetchSessoesTreinoMes: () => Promise<void>
  fetchSessoesTreinoAnalytics: (days?: number) => Promise<void>
  addTreinoHabito: (tipoTreino: string, metaMinutos: number) => Promise<void>
  iniciarTreino: (habitoId: number, tipoTreino: string, metaMinutos: number) => Promise<void>
  finalizarTreino: (sessaoId: number, payload?: FinalizarTreinoPayload) => Promise<void>
  runHealthCheck: () => Promise<void>
}

async function grantHabitoXp(get: () => SaudeSlice & Record<string, unknown>, tituloQuest?: string)
{
  const anyGet = get() as Record<string, unknown>
  if (anyGet.addXP) await (anyGet.addXP as (m: string, n: number) => Promise<void>)('saude', 10)
  if (tituloQuest && anyGet.incrementQuestProgress)
  {
    await (anyGet.incrementQuestProgress as (t: string, v: number) => Promise<void>)(tituloQuest, 1)
  }
}

const AGUA_MAX_COPOS = 32

function progressCap(h: HabitoDiario, raw: number): number
{
  const max = h.tipo === 'agua' ? AGUA_MAX_COPOS : h.meta_diaria
  return Math.min(Math.max(0, raw), max)
}
async function syncHealthDayBoundary(): Promise<void>
{
  const today = localTodayIso()
  if (!isNovoDiaDeSaude(today))
  {
    return
  }

  try
  {
    const uid = (await supabase.auth.getUser()).data.user?.id

    const { data: habitosRows } = await supabase.from('habitos_diarios').select('*')
    for (const row of habitosRows || [])
    {
      const h = mapHabito(row as Record<string, unknown>)
      if (!habitoPrecisaReset(h, today) && h.progresso_atual === 0)
      {
        continue
      }

      const diaAnterior = h.config?.ultima_data
      if (diaAnterior && diaAnterior !== today && h.progresso_atual > 0)
      {
        await upsertHabitHistorico(h.id, h.progresso_atual >= h.meta_diaria, diaAnterior)
      }

      const config = configAposResetDiario(h.config, today, h.tipo)
      await supabase
        .from('habitos_diarios')
        .update({ progresso_atual: 0, config })
        .eq('id', h.id)
    }

    if (uid)
    {
      await supabase.from('medicamentos').update({ tomado_hoje: 0 }).eq('user_id', uid)
    }

    writeStoredHealthDay(today)
  }
  catch { /* offline — reset local na leitura */ }
}

async function cleanupMedPhantoms(uid: string, medId: number): Promise<void>
{
  const { cleanupResolvedPhantoms } = await import('../../services/activeOrchestratorService')
  await cleanupResolvedPhantoms(uid, 'saude', medId)
}

export const createSaudeSlice: StateCreator<SaudeSlice, [], [], SaudeSlice> = (set, get) => ({
  medicamentos: [],
  medicamentoTomadas: [],
  habitos: [],
  habitosStreaks: [] as HabitoStreak[],
  sessaoTreinoAtiva: null,
  sessoesTreinoHoje: [],
  sessoesTreinoMes: [],
  sessoesTreinoAnalytics: [],

  fetchMedicamentoTomadas: async () =>
  {
    try
    {
      const today = localTodayIso()
      const { data, error } = await supabase
        .from('medicamento_tomadas')
        .select('*')
        .gte('tomado_em', `${today}T00:00:00`)
        .lte('tomado_em', `${today}T23:59:59`)
      if (error) throw error
      const tomadas = (data || []).map((row) => ({
        id: row.id as number,
        medicamento_id: row.medicamento_id as number,
        horario_previsto: String(row.horario_previsto ?? ''),
        tomado_em: String(row.tomado_em ?? ''),
      }))
      set({ medicamentoTomadas: tomadas })
      const todayIso = localTodayIso()
      set((s) => ({
        medicamentos: s.medicamentos.map((m) => ({
          ...m,
          tomado: medicamentoCompletoHoje(m, tomadas, todayIso),
        })),
      }))
    }
    catch { /* offline ou migration pendente */ }
  },

  fetchMedicamentos: async () =>
  {
    try
    {
      await syncHealthDayBoundary()
      const { data, error } = await supabase
        .from('medicamentos')
        .select('*')
      if (error) throw error
      const today = localTodayIso()
      let tomadas = get().medicamentoTomadas
      try
      {
        const { data: tomadasRows } = await supabase
          .from('medicamento_tomadas')
          .select('*')
          .gte('tomado_em', `${today}T00:00:00`)
          .lte('tomado_em', `${today}T23:59:59`)
        tomadas = (tomadasRows || []).map((row) => ({
          id: row.id as number,
          medicamento_id: row.medicamento_id as number,
          horario_previsto: String(row.horario_previsto ?? ''),
          tomado_em: String(row.tomado_em ?? ''),
        }))
      }
      catch { /* tabela ainda não migrada */ }

      set({
        medicamentoTomadas: tomadas,
        medicamentos: (data || []).map((row) => mapMedicamento(row as Record<string, unknown>, tomadas, today)),
      })
    }
    catch (e) { console.error('fetchMedicamentos:', e) }
  },

  addMedicamento: async (med) =>
  {
    const horarios = med.horarios?.length ? med.horarios : [med.horario]
    const config = {
      horarios,
      ...(med.config ?? {}),
    }
    const nomeNorm = med.nome.trim().toLowerCase()
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid)
    {
      const local: Medicamento = {
        id: Date.now(),
        nome: med.nome,
        horario: horarios[0],
        config,
        tomado: false,
      }
      set((s) =>
      {
        const dup = s.medicamentos.some((m) => m.nome.trim().toLowerCase() === nomeNorm)
        if (dup) return s
        return { medicamentos: [...s.medicamentos, local] }
      })
      return
    }
    try
    {
      const { data, error } = await supabase
        .from('medicamentos')
        .insert({ user_id: uid, nome: med.nome, horario: horarios[0], config })
        .select()
        .single()
      if (error) throw error
      if (data)
      {
        const today = localTodayIso()
        const mapped = mapMedicamento(data as Record<string, unknown>, get().medicamentoTomadas, today)
        set((s) =>
        {
          if (s.medicamentos.some((m) => m.id === mapped.id)) return s
          return { medicamentos: [...s.medicamentos, mapped] }
        })

        const consultaData = config.consulta_renovacao
        if (consultaData)
        {
          const createTask = (get as unknown as {
            createMedicamentoConsultaTask?: (o: {
              medicamentoId: number
              nome: string
              consultaData: string
            }) => Promise<void>
          }).createMedicamentoConsultaTask
          if (createTask)
          {
            await createTask({
              medicamentoId: mapped.id,
              nome: med.nome,
              consultaData,
            })
          }
          const { toast } = await import('sonner')
          toast.success('Consulta adicionada ao Kanban', { duration: 2200 })
        }
      }
    }
    catch (e)
    {
      console.error('addMedicamento:', e)
      // Reconcilia com o servidor em vez de criar fantasma local (evita duplicata)
      await get().fetchMedicamentos()
    }
  },

  removeMedicamento: async (id) =>
  {
    const prev = get().medicamentos
    set((s) => ({
      medicamentos: s.medicamentos.filter((m) => m.id !== id),
      medicamentoTomadas: s.medicamentoTomadas.filter((t) => t.medicamento_id !== id),
    }))
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return
      await supabase.from('medicamentos').delete().eq('id', id).eq('user_id', uid)
    }
    catch (e)
    {
      console.error('removeMedicamento:', e)
      set({ medicamentos: prev })
      await get().fetchMedicamentos()
    }
  },

  addMedicamentosBulk: async (items) =>
  {
    let saved = 0
    for (const item of items)
    {
      await get().addMedicamento(item)
      saved += 1
    }
    await get().fetchMedicamentos()
    return saved
  },

  removeMedicamentosBulk: async (ids) =>
  {
    const unique = [...new Set(ids)]
    for (const id of unique)
    {
      await get().removeMedicamento(id)
    }
    await get().fetchMedicamentos()
  },

  registrarTomadaMedicamento: async (medicamentoId, horarioPrevisto) =>
  {
    const today = localTodayIso()
    const med = get().medicamentos.find((m) => m.id === medicamentoId)
    if (!med) return
    if (tomadaParaDose(get().medicamentoTomadas, medicamentoId, horarioPrevisto, today))
    {
      return
    }

    const tomadoEm = new Date().toISOString()
    const optimistic: MedicamentoTomada = {
      id: Date.now(),
      medicamento_id: medicamentoId,
      horario_previsto: horarioPrevisto,
      tomado_em: tomadoEm,
    }

    set((s) =>
    {
      const tomadas = [...s.medicamentoTomadas, optimistic]
      return {
        medicamentoTomadas: tomadas,
        medicamentos: s.medicamentos.map((m) =>
          m.id === medicamentoId
            ? { ...m, tomado: medicamentoCompletoHoje(m, tomadas, today) }
            : m,
        ),
      }
    })

    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return

      const { data, error } = await supabase
        .from('medicamento_tomadas')
        .insert({
          user_id: uid,
          medicamento_id: medicamentoId,
          horario_previsto: horarioPrevisto,
        })
        .select()
        .single()
      if (error) throw error

      if (data)
      {
        const row = data as Record<string, unknown>
        const saved: MedicamentoTomada = {
          id: row.id as number,
          medicamento_id: row.medicamento_id as number,
          horario_previsto: String(row.horario_previsto ?? horarioPrevisto),
          tomado_em: String(row.tomado_em ?? tomadoEm),
        }
        set((s) => ({
          medicamentoTomadas: s.medicamentoTomadas.map((t) => t.id === optimistic.id ? saved : t),
        }))
      }

      const tomadas = get().medicamentoTomadas
      const completo = medicamentoCompletoHoje(med, tomadas, today)
      await supabase.from('medicamentos').update({ tomado_hoje: completo ? 1 : 0 }).eq('id', medicamentoId)

      if (completo)
      {
        await cleanupMedPhantoms(uid, medicamentoId)
        const anyGet = get() as unknown as Record<string, unknown>
        if (anyGet.addXP) await (anyGet.addXP as (m: string, n: number) => Promise<void>)('saude', 20)
      }
    }
    catch { /* offline */ }
  },

  updateTreinoPlanoSemana: async (plano) =>
  {
    const treino = await ensureTreinoRecord(get)
    if (!treino) return
    const config = { ...(treino.config ?? {}), plano_semana: plano }
    set((s) => ({
      habitos: s.habitos.map((h) => h.id === treino.id ? { ...h, config } : h),
    }))
    try
    {
      await supabase.from('habitos_diarios').update({ config }).eq('id', treino.id)
    }
    catch { /* offline */ }
  },

  updateAcademyTreinoConfig: async (patch) =>
  {
    const treino = await ensureTreinoRecord(get)
    if (!treino) return
    const atual = mergeAcademyConfig(treino.config as AcademyTreinoConfig)
    const merged: AcademyTreinoConfig = {
      ...atual,
      ...patch,
      exercicios_por_dia: patch.exercicios_por_dia
        ? { ...atual.exercicios_por_dia, ...patch.exercicios_por_dia }
        : atual.exercicios_por_dia,
      exercicios_por_data: patch.exercicios_por_data
        ? { ...atual.exercicios_por_data, ...patch.exercicios_por_data }
        : atual.exercicios_por_data,
      plano_por_data: patch.plano_por_data
        ? { ...atual.plano_por_data, ...patch.plano_por_data }
        : atual.plano_por_data,
      historico_cargas: patch.historico_cargas
        ? { ...atual.historico_cargas, ...patch.historico_cargas }
        : atual.historico_cargas,
      exercicios_customizados: patch.exercicios_customizados
        ? [...(atual.exercicios_customizados ?? []), ...patch.exercicios_customizados.filter(
          (c) => !(atual.exercicios_customizados ?? []).some((e) => e.id === c.id),
        )]
        : atual.exercicios_customizados,
    }
    const config = { ...(treino.config ?? {}), ...merged }
    set((s) => ({
      habitos: s.habitos.map((h) => h.id === treino.id ? { ...h, config } : h),
    }))
    try
    {
      await supabase.from('habitos_diarios').update({ config }).eq('id', treino.id)
    }
    catch { /* offline */ }
  },

  registrarSerieAcademia: async (exercicioId, pesoKg, reps) =>
  {
    const treino = get().habitos.find((h) => h.tipo === 'treino')
    if (!treino) return
    const atual = mergeAcademyConfig(treino.config as AcademyTreinoConfig)
    const historico_cargas = appendHistoricoCarga(
      atual.historico_cargas ?? {},
      exercicioId,
      pesoKg,
      reps,
    )
    await get().updateAcademyTreinoConfig({ historico_cargas })
  },

  toggleMedicamento: async (id) =>
  {
    // optimistic update
    set((s) => ({
      medicamentos: s.medicamentos.map((m) => m.id === id ? { ...m, tomado: !m.tomado } : m),
    }))
    try
    {
      // busca valor atual e inverte
      const { data: current } = await supabase.from('medicamentos').select('tomado_hoje').eq('id', id).single()
      await supabase.from('medicamentos').update({ tomado_hoje: current?.tomado_hoje === 1 ? 0 : 1 }).eq('id', id)

      // Se marcou como tomado, remove tarefa fantasma e ganha XP
      const med = get().medicamentos.find((m) => m.id === id)
      if (med && med.tomado)
      {
        const uid = (await supabase.auth.getUser()).data.user?.id
        if (uid)
        {
          const { cleanupResolvedPhantoms } = await import('../../services/activeOrchestratorService')
          await cleanupResolvedPhantoms(uid, 'saude', id)

          // Gamificação
          const anyGet = get() as any
          if (anyGet.addXP)
          {
            const stats = anyGet.userStats
            let multiplier = 1
            let newStreak = (stats?.streak_saude || 0) + 1
            let isStreakBonus = false

            if (newStreak >= 3)
            {
              multiplier = 2
              isStreakBonus = true
              newStreak = 0 // reseta
            }

            const xpToGrant = 20 * multiplier
            await anyGet.addXP('saude', xpToGrant)

            if (isStreakBonus)
            {
              const { toast } = await import('sonner')
              toast.success('Combo Vitalidade Renovada (+40 XP)', {
                description: 'Você tomou seus medicamentos no horário por 3 dias seguidos!',
              })
            }

            // atualiza streak_saude no Supabase
            await supabase.from('user_stats').update({ streak_saude: newStreak }).eq('id', uid);
            (set as any)((s: any) => ({ userStats: s.userStats ? { ...s.userStats, streak_saude: newStreak } : null }))
          }

          // Progresso de Quests
          const incrementQuestProgress = anyGet.incrementQuestProgress
          if (incrementQuestProgress) await incrementQuestProgress('Tomar um medicamento', 1)
        }
      }
    }
    catch (e)
    {
      console.error('toggleMedicamento error:', e)
      // reverte optimistic
      set((s) => ({
        medicamentos: s.medicamentos.map((m) => m.id === id ? { ...m, tomado: !m.tomado } : m),
      }))
    }
  },

  fetchHabitos: async () =>
  {
    const today = localTodayIso()
    const localBefore = get().habitos

    try
    {
      await syncHealthDayBoundary()
      const { data, error } = await supabase
        .from('habitos_diarios')
        .select('*')
      if (error) throw error
      const mapped = (data || []).map((row) => mapHabito(row as Record<string, unknown>))
      const habitos = mergeHabitosAfterFetch(localBefore, mapped, today)
      set({ habitos })

      const aguaMerged = habitos.find((h) => h.tipo === 'agua')
      if (
        aguaMerged
        && !isPhantomHabitId(aguaMerged.id)
        && aguaMerged.config?.ultima_data === today
      )
      {
        const remoteAgua = mapped.find((h) => h.tipo === 'agua')
        const remoteMl = remoteAgua?.config?.registros_ml?.length ?? 0
        const mergedMl = aguaMerged.config?.registros_ml?.length ?? aguaMerged.progresso_atual
        if (mergedMl > remoteMl)
        {
          try
          {
            const uid = (await supabase.auth.getUser()).data.user?.id
            const query = supabase
              .from('habitos_diarios')
              .update({
                progresso_atual: mergedMl,
                config: aguaMerged.config,
              })
              .eq('id', aguaMerged.id)
            const { error: syncErr } = uid ? await query.eq('user_id', uid) : await query
            if (syncErr) throw syncErr
          }
          catch (e)
          {
            console.error('sync agua cache→supabase:', e)
          }
        }
      }

      if (isNovoDiaDeSaude(today))
      {
        writeStoredHealthDay(today)
      }

      for (const h of mapped)
      {
        if (!habitoPrecisaReset(h, today))
        {
          continue
        }

        const merged = habitos.find((m) => m.id === h.id)
        if (merged?.config?.ultima_data === today)
        {
          // merge preservou progresso de hoje — não sobrescrever no Supabase
          continue
        }

        const diaAnterior = h.config?.ultima_data
        if (diaAnterior && diaAnterior !== today && h.progresso_atual > 0)
        {
          await upsertHabitHistorico(h.id, h.progresso_atual >= h.meta_diaria, diaAnterior)
        }

        const config = configAposResetDiario(h.config, today, h.tipo)
        await supabase
          .from('habitos_diarios')
          .update({ progresso_atual: 0, config })
          .eq('id', h.id)
      }
    }
    catch { /* offline */ }
  },

  addHabito: async (h) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    const payload = {
      ...h,
      config: h.config ?? {},
      progresso_atual: 0,
    }
    if (!uid)
    {
      set((s) => ({ habitos: [...s.habitos, { id: Date.now(), ...payload }] }))
      return
    }
    try
    {
      const { data, error } = await supabase
        .from('habitos_diarios')
        .insert({ user_id: uid, ...payload })
        .select()
        .single()
      if (error) throw error
      if (data) set((s) => ({ habitos: [...s.habitos, mapHabito(data as Record<string, unknown>)] }))
    }
    catch
    {
      set((s) => ({ habitos: [...s.habitos, { id: Date.now(), ...payload }] }))
    }
  },

  ensureHealthHabit: async (preset) =>
  {
    const existing = get().habitos.find((h) => h.tipo === preset.tipo)
    if (existing && !isPhantomHabitId(existing.id))
    {
      return existing
    }
    if (existing && isPhantomHabitId(existing.id))
    {
      set((s) => ({ habitos: s.habitos.filter((h) => h.id !== existing.id) }))
    }
    await get().addHabito(preset)
    await get().fetchHabitos()
    return get().habitos.find((h) => h.tipo === preset.tipo) ?? null
  },

  updateHabitoMeta: async (id, meta_diaria) =>
  {
    set((s) => ({
      habitos: s.habitos.map((h) => h.id === id ? { ...h, meta_diaria } : h),
    }))
    try
    {
      await supabase.from('habitos_diarios').update({ meta_diaria }).eq('id', id)
    }
    catch { /* offline */ }
  },

  incrementHabito: async (id) =>
  {
    const h = get().habitos.find((x) => x.id === id)
    const delta = h?.config?.incremento ?? 1
    await get().incrementHabitoBy(id, delta)
  },

  incrementHabitoBy: async (id, delta) =>
  {
    const today = localTodayIso()
    const before = get().habitos.find((h) => h.id === id)
    const wasDone = before ? before.progresso_atual >= before.meta_diaria : false

    set((s) => ({
      habitos: s.habitos.map((h) =>
        h.id === id
          ? {
            ...h,
            progresso_atual: progressCap(h, h.progresso_atual + delta),
            config: { ...(h.config ?? {}), ultima_data: today },
          }
          : h
      ),
    }))

    try
    {
      const { data: h } = await supabase
        .from('habitos_diarios')
        .select('progresso_atual, meta_diaria, config')
        .eq('id', id)
        .single()
      if (h)
      {
        const cfg = (typeof h.config === 'object' && h.config !== null ? h.config : {}) as HabitoDiarioConfig
        const habitMeta = before ?? get().habitos.find((x) => x.id === id)
        if (!habitMeta) return
        const next = progressCap(habitMeta, h.progresso_atual + delta)
        const config = { ...cfg, ultima_data: today }
        await supabase.from('habitos_diarios').update({ progresso_atual: next, config }).eq('id', id)

        const after = get().habitos.find((x) => x.id === id)
        if (after && !wasDone && after.progresso_atual >= after.meta_diaria)
        {
          await upsertHabitHistorico(id, true)
          const quest =
            after.tipo === 'agua' ? 'meta de água'
              : after.tipo === 'proteina' ? 'meta de proteína'
                : undefined
          await grantHabitoXp(get as () => SaudeSlice & Record<string, unknown>, quest)
        }
      }
    }
    catch { /* offline */ }
  },

  decrementHabito: async (id) =>
  {
    const today = localTodayIso()
    set((s) => ({
      habitos: s.habitos.map((h) =>
        h.id === id
          ? {
            ...h,
            progresso_atual: Math.max(h.progresso_atual - 1, 0),
            config: { ...(h.config ?? {}), ultima_data: today },
          }
          : h
      ),
    }))
    try
    {
      const { data: h } = await supabase
        .from('habitos_diarios')
        .select('progresso_atual, config')
        .eq('id', id)
        .single()
      if (h)
      {
        const cfg = (typeof h.config === 'object' && h.config !== null ? h.config : {}) as HabitoDiarioConfig
        const next = Math.max(h.progresso_atual - 1, 0)
        const config = { ...cfg, ultima_data: today }
        await supabase.from('habitos_diarios').update({ progresso_atual: next, config }).eq('id', id)
      }
    }
    catch { /* offline */ }
  },

  setHabitoProgress: async (id, progresso_atual) =>
  {
    const today = localTodayIso()
    const before = get().habitos.find((h) => h.id === id)
    if (!before) return

    const next = progressCap(before, progresso_atual)
    const wasDone = before.progresso_atual >= before.meta_diaria
    const config = { ...(before.config ?? {}), ultima_data: today }

    set((s) => ({
      habitos: s.habitos.map((h) =>
        h.id === id ? { ...h, progresso_atual: next, config } : h
      ),
    }))

    try
    {
      await supabase
        .from('habitos_diarios')
        .update({ progresso_atual: next, config })
        .eq('id', id)

      if (!wasDone && next >= before.meta_diaria)
      {
        await upsertHabitHistorico(id, true)
        const quest =
          before.tipo === 'agua' ? 'meta de água'
            : before.tipo === 'proteina' ? 'meta de proteína'
              : undefined
        await grantHabitoXp(get as () => SaudeSlice & Record<string, unknown>, quest)
      }
    }
    catch { /* offline */ }
  },

  updateHabitoConfig: async (id, patch) =>
  {
    let before = get().habitos.find((h) => h.id === id)
    if (!before && patch.ml_por_copo)
    {
      persistLocalMlPorCopo(patch.ml_por_copo)
      return
    }
    if (!before) return

    if (isPhantomHabitId(id))
    {
      const ensured = await get().ensureHealthHabit({
        tipo: before.tipo,
        nome_exibicao: before.nome_exibicao,
        meta_diaria: before.meta_diaria,
        unidade: before.unidade,
        config: before.config,
      })
      if (!ensured) return
      before = ensured
      id = ensured.id
    }

    const config = { ...(before.config ?? {}), ...patch }
    if (patch.ml_por_copo || patch.ml_presets || patch.ml_ocultos)
    {
      persistLocalWaterPrefs({
        ml_por_copo: config.ml_por_copo,
        ml_presets: config.ml_presets,
        ml_ocultos: config.ml_ocultos,
      })
    }
    if (patch.ml_por_copo)
    {
      persistLocalMlPorCopo(patch.ml_por_copo)
    }
    set((s) => ({
      habitos: s.habitos.map((h) => (h.id === id ? { ...h, config } : h)),
    }))
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      const query = supabase.from('habitos_diarios').update({ config }).eq('id', id)
      const { error } = uid ? await query.eq('user_id', uid) : await query
      if (error) throw error
    }
    catch (e)
    {
      console.error('updateHabitoConfig:', e)
      const { toast } = await import('sonner')
      toast.error('Não foi possível salvar a preferência de água')
    }
  },

  setAguaRegistros: async (id, registros_ml) =>
  {
    const today = localTodayIso()
    let before = get().habitos.find((h) => h.id === id)
    if (!before) return

    if (isPhantomHabitId(id))
    {
      const ensured = await get().ensureHealthHabit({
        tipo: 'agua',
        nome_exibicao: before.nome_exibicao,
        meta_diaria: before.meta_diaria,
        unidade: before.unidade,
        config: before.config,
      })
      if (!ensured) return
      before = ensured
      id = ensured.id
    }

    const next = Math.max(0, registros_ml.length)
    const wasDone = before.progresso_atual >= before.meta_diaria
    const config: HabitoDiarioConfig = {
      ...(before.config ?? {}),
      ultima_data: today,
      registros_ml,
    }

    writeCachedWaterEntries(registros_ml)

    set((s) => ({
      habitos: s.habitos.map((h) =>
        h.id === id ? { ...h, progresso_atual: next, config } : h
      ),
    }))

    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid)
      {
        const { toast } = await import('sonner')
        toast.message('Água salva neste aparelho — entre na conta para sincronizar')
        return
      }
      const query = supabase
        .from('habitos_diarios')
        .update({ progresso_atual: next, config })
        .eq('id', id)
      const { error } = await query.eq('user_id', uid)
      if (error) throw error

      writeStoredHealthDay(today)

      if (!wasDone && next >= before.meta_diaria)
      {
        await upsertHabitHistorico(id, true)
        await grantHabitoXp(get as () => SaudeSlice & Record<string, unknown>, 'meta de água')
      }
    }
    catch (e)
    {
      console.error('setAguaRegistros:', e)
      const cached = readCachedWaterEntries() ?? registros_ml
      set((s) => ({
        habitos: s.habitos.map((h) =>
          h.id === id
            ? {
              ...h,
              progresso_atual: cached.length,
              config: { ...(h.config ?? {}), ultima_data: today, registros_ml: cached },
            }
            : h
        ),
      }))
      const { toast } = await import('sonner')
      toast.error('Não foi possível sincronizar a água — mantido neste aparelho')
    }
  },

  deleteHabito: async (id) =>
  {
    set((s) => ({ habitos: s.habitos.filter((h) => h.id !== id) }))
    try { await supabase.from('habitos_diarios').delete().eq('id', id) }
    catch { /* offline */ }
  },

  fetchSessaoTreinoAtiva: async () =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid)
      {
        set({ sessaoTreinoAtiva: null })
        return
      }

      const { data, error } = await supabase
        .from('sessoes_treino')
        .select('*')
        .eq('user_id', uid)
        .is('finalizado_em', null)
        .order('iniciado_em', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      set({ sessaoTreinoAtiva: data ? mapSessao(data as Record<string, unknown>) : null })
    }
    catch (e)
    {
      console.error('fetchSessaoTreinoAtiva:', e)
      set({ sessaoTreinoAtiva: null })
    }
  },

  fetchSessoesTreinoHoje: async () =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid)
      {
        set({ sessoesTreinoHoje: [] })
        return
      }

      const hoje = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('sessoes_treino')
        .select('*')
        .eq('user_id', uid)
        .gte('created_at', `${hoje}T00:00:00`)
        .lte('created_at', `${hoje}T23:59:59`)
        .order('iniciado_em', { ascending: false })

      if (error) throw error
      set({ sessoesTreinoHoje: (data || []).map((row) => mapSessao(row as Record<string, unknown>)) })
    }
    catch (e)
    {
      console.error('fetchSessoesTreinoHoje:', e)
    }
  },

  fetchSessoesTreinoMes: async () =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid)
      {
        set({ sessoesTreinoMes: [] })
        return
      }

      const now = new Date()
      const inicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const fim = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

      const { data, error } = await supabase
        .from('sessoes_treino')
        .select('*')
        .eq('user_id', uid)
        .gte('created_at', inicio)
        .lte('created_at', fim)
        .order('iniciado_em', { ascending: false })

      if (error) throw error
      set({ sessoesTreinoMes: (data || []).map((row) => mapSessao(row as Record<string, unknown>)) })
    }
    catch (e)
    {
      console.error('fetchSessoesTreinoMes:', e)
    }
  },

  fetchSessoesTreinoAnalytics: async (days = 180) =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid)
      {
        set({ sessoesTreinoAnalytics: [] })
        return
      }

      const start = new Date()
      start.setHours(0, 0, 0, 0)
      start.setDate(start.getDate() - days + 1)
      const inicio = start.toISOString()

      const { data, error } = await supabase
        .from('sessoes_treino')
        .select('*')
        .eq('user_id', uid)
        .not('finalizado_em', 'is', null)
        .gte('finalizado_em', inicio)
        .order('finalizado_em', { ascending: false })

      if (error) throw error
      set({
        sessoesTreinoAnalytics: (data || []).map((row) => mapSessao(row as Record<string, unknown>)),
      })
    }
    catch (e)
    {
      console.error('fetchSessoesTreinoAnalytics:', e)
    }
  },

  addTreinoHabito: async (tipoTreino, metaMinutos) =>
  {
    await get().addHabito({
      tipo: 'treino',
      nome_exibicao: tipoTreino.trim(),
      meta_diaria: 1,
      unidade: 'sessão',
      config: { meta_minutos: metaMinutos },
    })
  },

  iniciarTreino: async (habitoId, tipoTreino, metaMinutos) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return

    if (get().sessaoTreinoAtiva)
    {
      const { toast } = await import('sonner')
      toast.error('Já existe um treino em andamento.')
      return
    }

    try
    {
      const { data, error } = await supabase
        .from('sessoes_treino')
        .insert({
          user_id: uid,
          habito_id: habitoId,
          tipo_treino: tipoTreino,
          meta_minutos: metaMinutos,
        })
        .select()
        .single()

      if (error) throw error
      if (data)
      {
        const sessao = mapSessao(data as Record<string, unknown>)
        set({ sessaoTreinoAtiva: sessao })
        set((s) => ({ sessoesTreinoHoje: [sessao, ...s.sessoesTreinoHoje] }))
      }
    }
    catch (e)
    {
      console.error('iniciarTreino:', e)
      const { toast } = await import('sonner')
      toast.error('Não foi possível iniciar o treino. Rode a migration 009 no Supabase.')
    }
  },

  finalizarTreino: async (sessaoId, payload) =>
  {
    const sessao = get().sessaoTreinoAtiva
    if (!sessao || sessao.id !== sessaoId) return

    const endIso = new Date().toISOString()
    const duracao = minutesBetween(sessao.iniciado_em, endIso)
    const completo = isWorkoutComplete(duracao, sessao.meta_minutos)

    const detalhe = payload
      ? buildAcademySessionDetail(payload)
      : null

    const updateRow: Record<string, unknown> = {
      finalizado_em: endIso,
      duracao_real_min: duracao,
      concluido: completo,
    }

    if (detalhe)
    {
      updateRow.treino_codigo = detalhe.treino_codigo
      updateRow.volume_kg = detalhe.volume_kg
      updateRow.detalhe = detalhe
    }

    try
    {
      const { error } = await supabase
        .from('sessoes_treino')
        .update(updateRow)
        .eq('id', sessaoId)

      if (error) throw error

      const updated: SessaoTreino = {
        ...sessao,
        finalizado_em: endIso,
        duracao_real_min: duracao,
        concluido: completo,
        treino_codigo: detalhe?.treino_codigo ?? sessao.treino_codigo,
        volume_kg: detalhe?.volume_kg ?? sessao.volume_kg,
        detalhe: detalhe ?? sessao.detalhe,
      }

      set({
        sessaoTreinoAtiva: null,
        sessoesTreinoHoje: get().sessoesTreinoHoje.map((s) =>
          s.id === sessaoId ? updated : s
        ),
      })

      const { toast } = await import('sonner')

      if (completo && sessao.habito_id)
      {
        const hab = get().habitos.find((h) => h.id === sessao.habito_id)
        if (hab && hab.progresso_atual < hab.meta_diaria)
        {
          await get().incrementHabito(hab.id)
        }
        await grantHabitoXp(get as () => SaudeSlice & Record<string, unknown>, 'treino')
        toast.success(`Treino completo! ${duracao} min (meta ${sessao.meta_minutos} min)`, {
          description: 'Jarvis registrou sua sessão como concluída.',
        })
      }
      else
      {
        toast.warning(`Treino encerrado: ${duracao} min`, {
          description: `Meta era ${sessao.meta_minutos} min (mín. 80% para contar como completo).`,
        })
      }

      await get().fetchSessoesTreinoHoje()
      await get().fetchSessoesTreinoMes()
      await get().fetchSessoesTreinoAnalytics(180)
    }
    catch (e)
    {
      console.error('finalizarTreino:', e)
      const { toast } = await import('sonner')
      toast.error('Erro ao finalizar treino.')
    }
  },

  fetchHabitosStreaks: async () =>
  {
    try
    {
      const { data, error } = await supabase
        .from('historico_habitos')
        .select('habito_id, data, concluido')
        .order('data', { ascending: false })
      if (error) throw error
      // agrupa por habito e calcula streak
      const streakMap = new Map<number, number>()
      if (data)
      {
        for (const row of data)
        {
          if (row.concluido === 1)
          {
            streakMap.set(row.habito_id, (streakMap.get(row.habito_id) || 0) + 1)
          }
        }
      }
      const habitos = get().habitos;
      const streaks: HabitoStreak[] = Array.from(streakMap.entries()).map(([habito_id, streak_dias]) => {
        const habito = habitos.find(h => h.id === habito_id);
        return {
          habito_id,
          nome_exibicao: habito ? habito.nome_exibicao : `Hábito ${habito_id}`,
          streak_dias,
          ultima_data: null, // Pode ser aprimorado com a última data real do histórico
        };
      })
      set({ habitosStreaks: streaks })
    }
    catch (e) { console.error('fetchHabitosStreaks:', e) }
  },

  runHealthCheck: async () =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return

      const meds = get().medicamentos
      if (meds.length === 0) return

      const { checkMedicamentosPendentes } = await import('../../services/activeOrchestratorService')
      const created = await checkMedicamentosPendentes(uid, meds, get().medicamentoTomadas)

      if (created > 0)
      {
        const { toast } = await import('sonner')
        toast.info(`${created} medicamento${created > 1 ? 's' : ''} pendente${created > 1 ? 's' : ''} detectado${created > 1 ? 's' : ''}`, {
          description: 'Tarefas criadas automaticamente no seu Kanban.',
        })
      }
    }
    catch (e) { console.error('runHealthCheck:', e) }
  },
})
