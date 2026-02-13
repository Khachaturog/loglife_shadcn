import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Pencil, X } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
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
import type { BlockConfig, BlockRow, DeedWithBlocks, RecordAnswerRow, RecordWithAnswers, ValueJson } from '@/types/database'
import { toast } from 'sonner'

function getBlockOptions(block: BlockRow): { id: string; label: string }[] {
  const fromConfig = (block.config as BlockConfig | null)?.options
  if (fromConfig?.length) return fromConfig.map((o) => ({ id: o.id, label: o.label }))
  const fromJoin = block.block_options
  if (fromJoin?.length) return fromJoin.map((o) => ({ id: o.id, label: o.label }))
  return []
}

function formatAnswer(value: ValueJson, block: BlockRow): string {
  if ('number' in value && value.number !== undefined) return String(value.number)
  if ('text' in value) return value.text ?? '—'
  if ('optionId' in value) {
    const opts = getBlockOptions(block)
    const o = opts.find((x) => x.id === value.optionId)
    return o?.label ?? value.optionId ?? '—'
  }
  if ('optionIds' in value && Array.isArray(value.optionIds)) {
    const opts = getBlockOptions(block)
    return value.optionIds.map((id) => opts.find((x) => x.id === id)?.label ?? id).join(', ') || '—'
  }
  if ('scaleValue' in value) return String(value.scaleValue)
  if ('yesNo' in value) return value.yesNo ? 'Да' : 'Нет'
  return '—'
}

export function RecordViewPage() {
  const { id: recordId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [record, setRecord] = useState<RecordWithAnswers | null>(null)
  const [deed, setDeed] = useState<DeedWithBlocks | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [recordDate, setRecordDate] = useState('')
  const [recordTime, setRecordTime] = useState('')
  const [notes, setNotes] = useState('')
  const [answers, setAnswers] = useState<Record<string, ValueJson>>({})

  useEffect(() => {
    if (!recordId) return
    let cancelled = false
    setLoading(true)
    api.records
      .get(recordId)
      .then((rec) => {
        if (!rec || cancelled) return
        setRecord(rec)
        setRecordDate(rec.record_date)
        setRecordTime(rec.record_time?.slice(0, 5) ?? '')
        setNotes(rec.notes ?? '')
        const ans: Record<string, ValueJson> = {}
        for (const a of rec.record_answers ?? []) {
          ans[a.block_id] = a.value_json
        }
        setAnswers(ans)
        return rec.deed_id
      })
      .then((deedId) => {
        if (!deedId || cancelled) return
        return api.deeds.get(deedId)
      })
      .then((d) => {
        if (!cancelled && d) setDeed(d)
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error(e?.message ?? 'Ошибка загрузки записи')
          navigate('/', { replace: true })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [recordId, navigate])

  const blocks = deed?.blocks ?? []
  const answersByBlockId = record?.record_answers?.reduce(
    (acc, a) => ({ ...acc, [a.block_id]: a }),
    {} as Record<string, RecordAnswerRow>,
  ) ?? {}

  async function handleSave() {
    if (!recordId || !record) return
    setSaving(true)
    try {
      await api.records.update(recordId, {
        record_date: recordDate,
        record_time: recordTime,
        notes,
        answers,
      })
      toast.success('Запись сохранена')
      setRecord((r) => r ? { ...r, record_date: recordDate, record_time: recordTime, notes } : null)
      setEditing(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  function setAnswer(blockId: string, value: ValueJson) {
    setAnswers((prev) => ({ ...prev, [blockId]: value }))
  }

  if (loading) return <LoadingState />

  if (!record) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Назад</Link>
        </Button>
        <p className="text-destructive">Запись не найдена.</p>
      </div>
    )
  }

  const backLink = record.deed_id ? `/deeds/${record.deed_id}` : '/'

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        backTo={backLink}
        title={<span className="block truncate">{`${record.record_date} в ${record.record_time?.slice(0, 5) ?? ''}`}</span>}
        actions={
          !editing ? (
            <Button variant="outline" size="icon" onClick={() => setEditing(true)} title="Редактировать">
              <Pencil className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={() => setEditing(false)}
                title="Отмена"
                aria-label="Отмена"
              >
                <X className="size-4" />
              </Button>
              <Button
                size="icon"
                className="size-9"
                onClick={handleSave}
                disabled={saving}
                title={saving ? 'Сохранение…' : 'Сохранить'}
                aria-label={saving ? 'Сохранение…' : 'Сохранить'}
              >
                {saving ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
                ) : (
                  <Check className="size-4" />
                )}
              </Button>
            </div>
          )
        }
      />

      {editing ? (
        <>
          <Card className="mt-0">
            <CardHeader>
              <CardTitle className="text-base">Дата и время</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-2 min-w-[150px]">
                <Label className="w-full">Дата</Label>
                <DatePicker
                  date={recordDate ? new Date(recordDate + 'T00:00:00') : undefined}
                  onDateChange={(d) => setRecordDate(d ? d.toISOString().slice(0, 10) : '')}
                  placeholder="Выберите дату"
                />
              </div>
              <div className="flex flex-col gap-0 min-w-[140px] h-fit">
                <TimePicker
                  id="record_time"
                  label="Время"
                  value={recordTime}
                  onChange={setRecordTime}
                />
              </div>
            </CardContent>
          </Card>

          {blocks.map((block) => (
            <Card key={block.id}>
              <CardHeader>
                <CardTitle className="text-base">{block.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {block.block_type === 'number' && (
                  <Input
                    type="number"
                    value={(answers[block.id] as { number?: number } | undefined)?.number ?? ''}
                    onChange={(e) => setAnswer(block.id, { number: Number(e.target.value) || 0 })}
                  />
                )}
                {block.block_type === 'text_short' && (
                  <Input
                    value={(answers[block.id] as { text?: string } | undefined)?.text ?? ''}
                    onChange={(e) => setAnswer(block.id, { text: e.target.value })}
                  />
                )}
                {block.block_type === 'text_paragraph' && (
                  <Textarea
                    value={(answers[block.id] as { text?: string } | undefined)?.text ?? ''}
                    onChange={(e) => setAnswer(block.id, { text: e.target.value })}
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
                      <SelectTrigger>
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
                  const current = (answers[block.id] as { scaleValue?: number } | undefined)?.scaleValue ?? 1
                  return (
                    <div className="flex gap-1 flex-wrap">
                      {Array.from({ length: divs }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setAnswer(block.id, { scaleValue: n })}
                          className={`h-10 min-w-10 rounded-md border px-2 text-sm font-medium ${
                            current === n ? 'bg-primary text-primary-foreground border-primary' : 'border-input bg-background'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
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
          ))}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Заметки</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card className="mt-0">
            <CardHeader>
              <CardTitle className="text-base">Дата и время</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{record.record_date} {record.record_time?.slice(0, 5)}</p>
            </CardContent>
          </Card>

          {blocks.map((block) => {
            const ans = answersByBlockId[block.id]
            const value = ans?.value_json
            const outdated = ans?.is_outdated
            return (
              <Card key={block.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {ans?.snapshot_title ?? block.title}
                    {outdated && (
                      <span className="text-xs font-normal text-muted-foreground">(устарело)</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={outdated ? 'text-muted-foreground' : ''}>
                    {value ? formatAnswer(value, block) : '—'}
                  </p>
                </CardContent>
              </Card>
            )
          })}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Заметки</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {record.notes || '—'}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
