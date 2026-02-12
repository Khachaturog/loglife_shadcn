import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/loading-state'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TimePicker } from '@/components/ui/time-picker'
import { api } from '@/lib/api'
import type { BlockConfig, BlockRow, DeedWithBlocks, ValueJson } from '@/types/database'
import { toast } from 'sonner'

function todayISO() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function nowTimeISO() {
  const d = new Date()
  return d.toTimeString().slice(0, 5)
}

function getBlockOptions(block: BlockRow): { id: string; label: string }[] {
  const fromConfig = (block.config as BlockConfig | null)?.options
  if (fromConfig?.length) return fromConfig.map((o) => ({ id: o.id, label: o.label }))
  const fromJoin = block.block_options
  if (fromJoin?.length) return fromJoin.map((o) => ({ id: o.id, label: o.label }))
  return []
}

export function FillFormPage() {
  const { id: deedId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [deed, setDeed] = useState<DeedWithBlocks | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [recordDate, setRecordDate] = useState(todayISO())
  const [recordTime, setRecordTime] = useState(nowTimeISO())
  const [notes, setNotes] = useState('')
  const [answers, setAnswers] = useState<Record<string, ValueJson>>({})

  useEffect(() => {
    if (!deedId) return
    let cancelled = false
    setLoading(true)
    api.deeds
      .get(deedId)
      .then((data) => {
        if (!cancelled) setDeed(data ?? null)
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error(e?.message ?? 'Ошибка загрузки дела')
          navigate('/', { replace: true })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [deedId, navigate])

  const blocks = useMemo(() => deed?.blocks ?? [], [deed])

  const requiredMissing = useMemo(() => {
    for (const b of blocks) {
      if (!b.is_required) continue
      const v = answers[b.id]
      if (v === undefined) return true
      if ('number' in v && v.number === undefined) return true
      if ('text' in v && (v.text ?? '').trim() === '') return true
      if ('optionId' in v && !v.optionId) return true
      if ('optionIds' in v && (!v.optionIds || v.optionIds.length === 0)) return true
      if ('scaleValue' in v && (v.scaleValue === undefined || v.scaleValue < 1)) return true
      if ('yesNo' in v && v.yesNo === undefined) return true
    }
    return false
  }, [blocks, answers])

  const firstMissingRequiredBlockId = useMemo(() => {
    for (const b of blocks) {
      if (!b.is_required) continue
      const v = answers[b.id]
      if (v === undefined) return b.id
      if ('number' in v && v.number === undefined) return b.id
      if ('text' in v && (v.text ?? '').trim() === '') return b.id
      if ('optionId' in v && !v.optionId) return b.id
      if ('optionIds' in v && (!v.optionIds || v.optionIds.length === 0)) return b.id
      if ('scaleValue' in v && (v.scaleValue === undefined || v.scaleValue < 1)) return b.id
      if ('yesNo' in v && v.yesNo === undefined) return b.id
    }
    return null
  }, [blocks, answers])

  const canSubmit = !requiredMissing && !saving

  function setAnswer(blockId: string, value: ValueJson) {
    setAnswers((prev) => ({ ...prev, [blockId]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!deedId || !canSubmit) return
    setSaving(true)
    try {
      await api.deeds.createRecord(deedId, {
        record_date: recordDate,
        record_time: recordTime,
        notes: notes.trim() || undefined,
        answers: Object.keys(answers).length ? answers : undefined,
      })
      toast.success('Запись добавлена')
      navigate(`/deeds/${deedId}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка сохранения'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <LoadingState />
    )
  }

  if (!deed) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Назад</Link>
        </Button>
        <p className="text-destructive">Дело не найдено.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/deeds/${deedId}`} aria-label="Назад">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight truncate">
          <span className="mr-2" aria-hidden>{deed.emoji}</span>
          {deed.name}
        </h1>
      </div>

      {deed.description && (
        <p className="text-muted-foreground text-sm whitespace-pre-wrap">
          {deed.description}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-0">
        <Card>
          <CardHeader>
            <CardTitle>Дата и время</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="space-y-2 min-w-[200px]">
              <Label>Дата</Label>
              <DatePicker
                date={recordDate ? new Date(recordDate + 'T00:00:00') : undefined}
                onDateChange={(d) => setRecordDate(d ? d.toISOString().slice(0, 10) : todayISO())}
                placeholder="Выберите дату"
              />
            </div>
            <div className="min-w-[140px]">
              <TimePicker
                id="record_time"
                label="Время"
                value={recordTime}
                onChange={setRecordTime}
              />
            </div>
          </CardContent>
        </Card>

        {blocks.map((block) => {
          const isInvalid = block.is_required && firstMissingRequiredBlockId === block.id
          return (
          <Card key={block.id} aria-invalid={isInvalid} aria-required={block.is_required}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2" id={`block-label-${block.id}`}>
                {block.title}
                {block.is_required && <span className="text-destructive" aria-label="Обязательное">*</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {block.block_type === 'number' && (
                <Input
                  type="number"
                  value={(answers[block.id] as { number?: number } | undefined)?.number ?? ''}
                  onChange={(e) => setAnswer(block.id, { number: Number(e.target.value) || 0 })}
                  placeholder="0"
                />
              )}
              {block.block_type === 'text_short' && (
                <Input
                  value={(answers[block.id] as { text?: string } | undefined)?.text ?? ''}
                  onChange={(e) => setAnswer(block.id, { text: e.target.value })}
                  placeholder="Краткий ответ"
                />
              )}
              {block.block_type === 'text_paragraph' && (
                <Textarea
                  value={(answers[block.id] as { text?: string } | undefined)?.text ?? ''}
                  onChange={(e) => setAnswer(block.id, { text: e.target.value })}
                  placeholder="Текст"
                />
              )}
              {block.block_type === 'single_select' && (() => {
                const opts = getBlockOptions(block)
                const current = (answers[block.id] as { optionId?: string } | undefined)?.optionId
                return (
                  <Select
                    value={current ?? ''}
                    onValueChange={(value) => setAnswer(block.id, { optionId: value })}
                  >
                    <SelectTrigger aria-labelledby={`block-label-${block.id}`}>
                      <SelectValue placeholder="Выберите вариант" />
                    </SelectTrigger>
                    <SelectContent>
                      {opts.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              })()}
              {block.block_type === 'multi_select' && (() => {
                const opts = getBlockOptions(block)
                const current = (answers[block.id] as { optionIds?: string[] } | undefined)?.optionIds ?? []
                return (
                  <div className="space-y-2">
                    {opts.map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={current.includes(opt.id)}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...current, opt.id]
                              : current.filter((id) => id !== opt.id)
                            setAnswer(block.id, { optionIds: next })
                          }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )
              })()}
              {block.block_type === 'scale' && (() => {
                const divs = Math.min(10, Math.max(1, (block.config as BlockConfig | null)?.divisions ?? 5))
                const left = (block.config as BlockConfig | null)?.labelLeft ?? ''
                const right = (block.config as BlockConfig | null)?.labelRight ?? ''
                const current = (answers[block.id] as { scaleValue?: number } | undefined)?.scaleValue ?? 1
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                      <span>{left || '1'}</span>
                      <span>{right || String(divs)}</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {Array.from({ length: divs }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setAnswer(block.id, { scaleValue: n })}
                          className={`h-10 min-w-10 rounded-md border px-2 text-sm font-medium transition-colors ${
                            current === n
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-input bg-background hover:bg-accent'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })()}
              {block.block_type === 'yes_no' && (() => {
                const current = (answers[block.id] as { yesNo?: boolean } | undefined)?.yesNo
                return (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`block-${block.id}`}
                        checked={current === true}
                        onChange={() => setAnswer(block.id, { yesNo: true })}
                        className="h-4 w-4 rounded-full border-input text-primary"
                      />
                      <span>Да</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`block-${block.id}`}
                        checked={current === false}
                        onChange={() => setAnswer(block.id, { yesNo: false })}
                        className="h-4 w-4 rounded-full border-input text-primary"
                      />
                      <span>Нет</span>
                    </label>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
          )
        })}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Заметки</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Свободные заметки к записи"
            />
          </CardContent>
        </Card>

        {requiredMissing && (
          <p className="text-sm text-destructive" role="alert">
            Заполните все обязательные поля (отмечены *).
          </p>
        )}

        <Button type="submit" disabled={!canSubmit}>
          {saving ? 'Сохранение…' : 'Добавить запись'}
        </Button>
      </form>
    </div>
  )
}
