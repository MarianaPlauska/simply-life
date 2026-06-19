/** Parser de medicamentos em lote — uma linha por item: Nome | 08:00, 20:00 */

export interface MedicamentoBulkRow
{
  nome: string
  horario: string
  horarios: string[]
}

export function parseMedicamentosBulk(text: string): MedicamentoBulkRow[]
{
  const rows: MedicamentoBulkRow[] = []

  for (const raw of text.split('\n'))
  {
    const line = raw.trim()
    if (!line) continue

    const parts = line.split(/[|;]/).map((p) => p.trim()).filter(Boolean)
    const nome = parts[0] ?? ''
    const horariosRaw = parts[1] ?? '08:00'
    const horarios = horariosRaw
      .split(/[,;]+/)
      .map((h) => h.trim())
      .filter(Boolean)

    if (!nome || horarios.length === 0) continue

    rows.push({
      nome,
      horario: horarios[0],
      horarios,
    })
  }

  return rows
}
