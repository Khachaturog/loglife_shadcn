import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { RecordCard } from '@/components/RecordCard'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { api } from '@/lib/api'
import type { DeedWithBlocks, RecordRow } from '@/types/database'

export function DeedViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [deed, setDeed] = useState<DeedWithBlocks | null>(null)
  const [records, setRecords] = useState<(RecordRow & { record_answers?: { block_id: string; value_json: unknown }[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    Promise.all([api.deeds.get(id), api.deeds.records(id)])
      .then(([deedData, recordsData]) => {
        if (!cancelled) {
          setDeed(deedData ?? null)
          setRecords(recordsData)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Ошибка загрузки')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  const handleDelete = async () => {
    if (!id) return
    await api.deeds.delete(id)
    navigate('/')
  }

  if (loading) return <LoadingState />
  if (error || !deed) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Назад</Link>
        </Button>
        <ErrorState message={error ?? 'Дело не найдено'} />
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      <PageHeader backTo="/" title={<><span className="mr-2" aria-hidden>{deed.emoji}</span>{deed.name}</>} />

      {deed.description && (
        <p className="text-muted-foreground text-sm whitespace-pre-wrap">{deed.description}</p>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 pt-0">
            <Button asChild>
              <Link to={`/deeds/${id}/fill`}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить запись
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/deeds/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Редактировать дело
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить дело
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить дело?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Все записи по этому делу также будут удалены. Это действие нельзя отменить.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Удалить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
      </Card>

      <section className="w-full h-full flex flex-col gap-2">
        <h2 className="text-lg font-semibold mb-0">История записей</h2>
        {records.length === 0 ? (
          <p className="text-muted-foreground text-sm h-full w-full">Пока нет записей. Добавьте первую.</p>
        ) : (
          <ul className="space-y-2">
            {records.map((rec) => (
              <li key={rec.id}>
                <RecordCard record={rec} variant="deed" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
