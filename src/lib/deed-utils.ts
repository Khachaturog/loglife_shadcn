import type {
  BlockRow,
  RecordRow,
  RecordAnswerRow,
  ValueJson,
} from '@/types/database'
import { todayLocalISO } from '@/lib/format-utils'

// --- Логика отображения "N сегодня · N всего" на карточке дела ---
//
// N определяется по блокам дела типа number и scale:
//
// • Если в деле больше одного блока "число"/"шкала" ИЛИ один "число" + одна "шкала"
//   → показываем КОЛИЧЕСТВО ЗАПИСЕЙ этого дела (сколько раз заполняли форму).
//
// • Если в деле ровно один блок "число" или "шкала"
//   → показываем СУММУ значений этого блока по всем ответам (number → value, scale → scaleValue).
//
// "N сегодня" — то же правило, но только по записям с record_date = сегодня (локальная дата).
// "N всего" — по всем записям дела.
//
// Если в деле нет ни одного блока number/scale, показываем 0 сегодня и 0 всего.

function getNumericBlocks(blocks: BlockRow[]): BlockRow[] {
  return (blocks ?? []).filter(
    (b) => b.block_type === 'number' || b.block_type === 'scale' || b.block_type === 'duration'
  )
}

function getTodayDateString(): string {
  return todayLocalISO()
}

function getValueFromAnswer(valueJson: ValueJson, blockType: 'number' | 'scale' | 'duration'): number {
  if (blockType === 'number' && 'number' in valueJson) return Number(valueJson.number) || 0
  if (blockType === 'scale' && 'scaleValue' in valueJson) return Number(valueJson.scaleValue) || 0
  if (blockType === 'duration' && 'durationHms' in valueJson) {
    const hms = (valueJson as { durationHms: string }).durationHms
    const [h, m, s] = (hms ?? '0:0:0').split(':').map((x) => parseInt(x, 10) || 0)
    return h * 3600 + m * 60 + s
  }
  return 0
}

export function getDeedDisplayNumbers(
  blocks: BlockRow[],
  records: (RecordRow & { record_answers?: RecordAnswerRow[] })[]
): { today: number; total: number } {
  const numericBlocks = getNumericBlocks(blocks)
  const todayStr = getTodayDateString()

  if (numericBlocks.length === 0) {
    return { today: 0, total: 0 }
  }

  // For duration, or multiple numeric blocks: show record count
  const hasDuration = numericBlocks.some((b) => b.block_type === 'duration')
  const useCount = numericBlocks.length > 1 || hasDuration
  if (useCount) {
    const today = records.filter((r) => r.record_date === todayStr).length
    const total = records.length
    return { today, total }
  }

  const singleBlock = numericBlocks[0]
  const blockId = singleBlock.id
  const blockType = singleBlock.block_type as 'number' | 'scale' | 'duration'

  let sumToday = 0
  let sumTotal = 0
  for (const rec of records) {
    const answer = rec.record_answers?.find((a) => a.block_id === blockId)
    const value = answer ? getValueFromAnswer(answer.value_json, blockType) : 0
    sumTotal += value
    if (rec.record_date === todayStr) sumToday += value
  }
  return { today: sumToday, total: sumTotal }
}
