import type { BlockConfig, BlockRow, DeedWithBlocks, RecordAnswerRow, ValueJson } from '@/types/database'
import { api } from '@/lib/api'

const MAX_BLOCK_COLUMNS = 15

function escapeCsvCell(s: string): string {
  if (/["\n\r,]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function formatValueForCsv(value: ValueJson): string {
  if (!value) return ''
  if ('number' in value && value.number !== undefined) return String(value.number)
  if ('text' in value) return value.text ?? ''
  if ('optionId' in value) return value.optionId ?? ''
  if ('optionIds' in value && Array.isArray(value.optionIds)) return value.optionIds.join('; ')
  if ('scaleValue' in value) return String(value.scaleValue)
  if ('yesNo' in value) return value.yesNo ? 'Да' : 'Нет'
  return ''
}

function getBlockOptions(block: BlockRow): { id: string; label: string }[] {
  const fromConfig = (block.config as BlockConfig | null)?.options
  if (fromConfig?.length) return fromConfig.map((o) => ({ id: o.id, label: o.label }))
  const fromJoin = block.block_options
  if (fromJoin?.length) return fromJoin.map((o) => ({ id: o.id, label: o.label }))
  return []
}

function formatAnswerForCsv(value: ValueJson, block: BlockRow): string {
  if (!value) return ''
  if ('optionId' in value) {
    const opts = getBlockOptions(block)
    const o = opts.find((x) => x.id === value.optionId)
    return o?.label ?? value.optionId ?? ''
  }
  if ('optionIds' in value && Array.isArray(value.optionIds)) {
    const opts = getBlockOptions(block)
    return value.optionIds.map((id) => opts.find((x) => x.id === id)?.label ?? id).join('; ')
  }
  return formatValueForCsv(value)
}

export async function exportAllToCsv(): Promise<string> {
  const deeds = await api.deeds.list()
  const deedsWithBlocks: DeedWithBlocks[] = []
  for (const d of deeds) {
    const full = await api.deeds.get(d.id)
    if (full) deedsWithBlocks.push(full)
  }

  const header = [
    'deed_name',
    'record_date',
    'record_time',
    'notes',
    ...Array.from({ length: MAX_BLOCK_COLUMNS }, (_, i) => `block_${i + 1}`),
  ].map(escapeCsvCell).join(',')

  const rows: string[] = [header]

  for (const deed of deedsWithBlocks) {
    const blocks = (deed.blocks ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)
    const records = await api.deeds.records(deed.id)
    const deedName = `${deed.emoji || ''} ${deed.name}`.trim()

    for (const rec of records) {
      const answersByBlock = (rec.record_answers ?? []).reduce(
        (acc, a) => ({ ...acc, [a.block_id]: a }),
        {} as Record<string, RecordAnswerRow>,
      )
      const blockValues = blocks.map((b) => {
        const ans = answersByBlock[b.id]
        const value = ans?.value_json
        return value ? formatAnswerForCsv(value, b) : ''
      })
      const cells = [
        deedName,
        rec.record_date,
        (rec.record_time ?? '').toString().slice(0, 5),
        (rec.notes ?? '').replace(/\r?\n/g, ' '),
        ...blockValues,
        ...Array(Math.max(0, MAX_BLOCK_COLUMNS - blockValues.length)).fill(''),
      ].map(escapeCsvCell)
      rows.push(cells.join(','))
    }
  }

  return rows.join('\n')
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
