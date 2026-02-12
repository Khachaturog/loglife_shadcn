import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import type { DeedRow, RecordRow, ValueJson } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'

type RecordWithDeed = (RecordRow & { record_answers?: { value_json: unknown }[] }) & {
  deed?: { emoji: string; name: string }
}

function previewAnswer(value: ValueJson): string {
  if (!value) return '—'
  if ('number' in value && value.number !== undefined) return String(value.number)
  if ('text' in value && value.text) return value.text.length > 25 ? value.text.slice(0, 25) + '…' : value.text
  if ('optionId' in value) return '✓'
  if ('optionIds' in value && Array.isArray(value.optionIds)) return value.optionIds.length ? `✓ ${value.optionIds.length}` : '—'
  if ('scaleValue' in value) return String(value.scaleValue)
  if ('yesNo' in value) return value.yesNo ? 'Да' : 'Нет'
  return '—'
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Сегодня'
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function HistoryPage() {
  const [recordsWithDeed, setRecordsWithDeed] = useState<RecordWithDeed[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api.deeds
      .list()
      .then((list) => {
        if (cancelled) return null
        return Promise.all(list.map((d) => api.deeds.records(d.id))).then((recordsPerDeed) => ({
          list,
          recordsPerDeed,
        }))
      })
      .then((data) => {
        if (cancelled || !data) return
        const { list, recordsPerDeed } = data
        const all: RecordWithDeed[] = []
        list.forEach((deed: DeedRow, i: number) => {
          const recs = recordsPerDeed[i] ?? []
          const info = { emoji: deed.emoji ?? '', name: deed.name }
          for (const r of recs) {
            all.push({ ...r, deed: info })
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
      <h1 className="text-2xl font-bold tracking-tight">История</h1>
      <p className="text-sm text-muted-foreground">
        Все записи по всем делам, сгруппированные по датам.
      </p>

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
                    <Link to={`/records/${rec.id}`}>
                      <Card className="hover:bg-accent/50 transition-colors">
                        <CardContent className="py-3 px-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="text-sm font-medium shrink-0">
                            {(rec.record_time ?? '').toString().slice(0, 5)}
                          </span>
                          <span className="text-sm truncate">
                            {rec.deed?.emoji} {rec.deed?.name}
                          </span>
                          <span className="text-muted-foreground text-sm truncate sm:ml-auto">
                            {rec.record_answers?.length
                              ? previewAnswer(rec.record_answers[0].value_json as ValueJson)
                              : '—'}
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
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
