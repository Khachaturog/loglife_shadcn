import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
import type { DeedWithBlocks, RecordRow, ValueJson } from '@/types/database'

function previewAnswer(value: ValueJson): string {
  if (!value) return '—'
  if ('number' in value && value.number !== undefined) return String(value.number)
  if ('text' in value && value.text) return value.text.length > 20 ? value.text.slice(0, 20) + '…' : value.text
  if ('optionId' in value) return '✓'
  if ('optionIds' in value && Array.isArray(value.optionIds)) return value.optionIds.length ? `✓ ${value.optionIds.length}` : '—'
  if ('scaleValue' in value) return String(value.scaleValue)
  if ('yesNo' in value) return value.yesNo ? 'Да' : 'Нет'
  return '—'
}

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Загрузка…
      </div>
    )
  }

  if (error || !deed) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Назад</Link>
        </Button>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error ?? 'Дело не найдено'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/" aria-label="Назад"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight flex-1 truncate">
          <span className="mr-2" aria-hidden>{deed.emoji}</span>
          {deed.name}
        </h1>
      </div>

      <Card>
        <CardHeader>
          {deed.description && (
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{deed.description}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
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

      <section>
        <h2 className="text-lg font-semibold mb-3">История записей</h2>
        {records.length === 0 ? (
          <p className="text-muted-foreground text-sm">Пока нет записей. Добавьте первую.</p>
        ) : (
          <ul className="space-y-2">
            {records.map((rec) => (
              <li key={rec.id}>
                <Link to={`/records/${rec.id}`}>
                  <Card className="hover:bg-accent/50 transition-colors">
                    <CardContent className="py-3 px-4 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {rec.record_date} {rec.record_time}
                      </span>
                      <span className="text-muted-foreground text-sm truncate max-w-[50%]">
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
        )}
      </section>
    </div>
  )
}
