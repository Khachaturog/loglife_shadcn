import type { RecordWithAnswers, ValueJson } from '@/types/database'

/** Ответы из сущности записи — единый источник с сервера для просмотра, отката и дублирования на форму. */
export function answersFromRecord(rec: RecordWithAnswers): Record<string, ValueJson> {
  const ans: Record<string, ValueJson> = {}
  for (const a of rec.record_answers ?? []) ans[a.block_id] = a.value_json
  return ans
}
