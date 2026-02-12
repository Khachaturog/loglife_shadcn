import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import type { RecordRow } from '@/types/database'
import { RecordCard } from '@/components/RecordCard'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { formatDate } from '@/lib/format-utils'

type RecordWithDeed = (RecordRow & { record_answers?: { value_json: unknown }[] }) & {
  deed?: { emoji: string; name: string }
}

export function HistoryPage() {
  const [recordsWithDeed, setRecordsWithDeed] = useState<RecordWithDeed[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api.deeds
      .listAllRecordsWithDeedInfo()
      .then((records) => {
        if (cancelled) return
        const all: RecordWithDeed[] = records.map((r) => {
          const row = r as { deeds?: { emoji: string; name: string } | null; deed?: { emoji: string; name: string } | null }
          const deedInfo = row.deeds ?? row.deed
          return {
            ...r,
            deed: deedInfo ? { emoji: deedInfo.emoji ?? '', name: deedInfo.name ?? '' } : undefined,
          }
        })
        all.sort((a, b) => {
          const d = b.record_date.localeCompare(a.record_date)
          if (d !== 0) return d
          return (b.record_time ?? '').toString().localeCompare((a.record_time ?? '').toString())
        })
        setRecordsWithDeed(all)
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Ошибка загрузки')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const byDate = useMemo(() => {
    const map = new Map<string, RecordWithDeed[]>()
    for (const r of recordsWithDeed) {
      const date = r.record_date
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(r)
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [recordsWithDeed])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  return (
    <div className="w-full flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">История</h1>
        <p className="text-sm text-muted-foreground">
          Все записи по всем делам, сгруппированные по датам.
        </p>
      </header>

      {byDate.length === 0 ? (
        <p className="text-muted-foreground text-sm">Пока нет записей. Добавьте первую в любом деле.</p>
      ) : (
        <div className="space-y-6">
          {byDate.map(([date, records]) => (
            <section key={date}>
              <h2 className="text-lg font-semibold mb-3">{formatDate(date)}</h2>
              <ul className="space-y-2">
                {records.map((rec) => (
                  <li key={rec.id}>
                    <RecordCard record={rec} variant="history" />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
