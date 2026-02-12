import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { DeedCard } from '@/components/DeedCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { api } from '@/lib/api'
import type { DeedWithBlocks } from '@/types/database'
import type { RecordRow, RecordAnswerRow } from '@/types/database'

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
        if (cancelled) return null
        setDeeds(data)
        return api.deeds.recordsByDeedIds(data.map((d) => d.id))
      })
      .then((byId) => {
        if (cancelled || !byId) return
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

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Дела</h1>
        <Button asChild>
          <Link to="/deeds/new">
            <Plus className="h-4 w-4" />
            Создать
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
          {deeds.map((deed) => (
            <li key={deed.id}>
              <DeedCard deed={deed} records={recordsByDeedId[deed.id] ?? []} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
