import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { api } from '@/lib/api'
import type {
  BlockRow,
  DeedWithBlocks,
  RecordAnswerRow,
  RecordRow,
  ValueJson,
} from '@/types/database'

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
// Если в деле нет ни одного блока number/scale, показываем 0 сегодня и 0 всего (или можно показывать количество записей — текущая реализация: 0).

function getNumericBlocks(blocks: BlockRow[]): BlockRow[] {
  return (blocks ?? []).filter((b) => b.block_type === 'number' || b.block_type === 'scale')
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function getValueFromAnswer(valueJson: ValueJson, blockType: 'number' | 'scale'): number {
  if (blockType === 'number' && 'number' in valueJson) return Number(valueJson.number) || 0
  if (blockType === 'scale' && 'scaleValue' in valueJson) return Number(valueJson.scaleValue) || 0
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

  const useCount = numericBlocks.length > 1
  if (useCount) {
    const today = records.filter((r) => r.record_date === todayStr).length
    const total = records.length
    return { today, total }
  }

  const singleBlock = numericBlocks[0]
  const blockId = singleBlock.id
  const blockType = singleBlock.block_type as 'number' | 'scale'

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

export function DeedsListPage() {
  const [deeds, setDeeds] = useState<DeedWithBlocks[]>([])
  const [recordsByDeedId, setRecordsByDeedId] = useState<Record<string, (RecordRow & { record_answers?: RecordAnswerRow[] })[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api.deeds
      .listWithBlocks()
      .then((data) => {
        if (cancelled) return
        setDeeds(data)
        return Promise.all(data.map((d) => api.deeds.records(d.id))).then((recordsPerDeed) => ({ data, recordsPerDeed }))
      })
      .then((result) => {
        if (cancelled || !result) return
        const { data, recordsPerDeed } = result
        const byId: Record<string, (RecordRow & { record_answers?: RecordAnswerRow[] })[]> = {}
        data.forEach((d, i) => {
          byId[d.id] = recordsPerDeed[i] ?? []
        })
        setRecordsByDeedId(byId)
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Ошибка загрузки')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Загрузка…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Дела</h1>
        <Button asChild>
          <Link to="/deeds/new">
            <Plus className="h-4 w-4" />
            Создать дело
          </Link>
        </Button>
      </div>

      {deeds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">Нет дел. Создайте первое.</p>
            <Button asChild className="mt-4">
              <Link to="/deeds/new">Создать дело</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {deeds.map((deed) => {
            const records = recordsByDeedId[deed.id] ?? []
            const { today, total } = getDeedDisplayNumbers(deed.blocks ?? [], records)
            return (
              <li key={deed.id}>
                <Card className="transition-colors hover:bg-accent/50">
                  <Link to={`/deeds/${deed.id}`} className="block">
                    <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                      <span className="text-2xl" aria-hidden>{deed.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold truncate">{deed.name}</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {today} сегодня · {total} всего
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild onClick={(e: React.MouseEvent) => e.preventDefault()}>
                          <Link to={`/deeds/${deed.id}/fill`} onClick={(e) => e.stopPropagation()}>
                            Добавить запись
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
