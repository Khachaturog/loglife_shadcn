import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { api } from '@/lib/api'
import type { BlockConfig, BlockType, DeedWithBlocks } from '@/types/database'
import { toast } from 'sonner'

type UiBlock = {
  id?: string
  title: string
  block_type: BlockType
  is_required: boolean
  config: BlockConfig | null
}

const BLOCK_TYPE_LABEL: Record<BlockType, string> = {
  number: 'Число',
  text_short: 'Текст (строка)',
  text_paragraph: 'Текст (абзац)',
  single_select: 'Один из списка',
  multi_select: 'Несколько из списка',
  scale: 'Шкала',
  yes_no: 'Да/Нет',
}

function createDefaultBlock(): UiBlock {
  return {
    title: 'Значение',
    block_type: 'number',
    is_required: false,
    config: null,
  }
}

function createDefaultScaleConfig(): BlockConfig {
  return {
    divisions: 5,
    labelLeft: '',
    labelRight: '',
  }
}

function createOptionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

function createDefaultSelectConfig(): BlockConfig {
  return {
    options: [
      { id: createOptionId(), label: 'Вариант 1', sort_order: 0 },
      { id: createOptionId(), label: 'Вариант 2', sort_order: 1 },
    ],
  }
}

export function DeedFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  const [emoji, setEmoji] = useState('📋')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [blocks, setBlocks] = useState<UiBlock[]>([createDefaultBlock()])

  useEffect(() => {
    if (!id || isNew) return
    let cancelled = false
    setLoading(true)
    api.deeds
      .get(id)
      .then((deed: DeedWithBlocks | null) => {
        if (!deed || cancelled) return
        setEmoji(deed.emoji || '📋')
        setName(deed.name || '')
        setDescription(deed.description ?? '')
        const mapped: UiBlock[] =
          deed.blocks?.map((b) => ({
            id: b.id,
            title: b.title,
            block_type: b.block_type,
            is_required: b.is_required,
            config: b.config ?? null,
          })) ?? [createDefaultBlock()]
        setBlocks(mapped.length ? mapped : [createDefaultBlock()])
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
    return () => {
      cancelled = true
    }
  }, [id, isNew, navigate])

  const canSave = useMemo(
    () => name.trim().length > 0 && blocks.length > 0,
    [name, blocks],
  )

  function updateBlock(index: number, updater: (block: UiBlock) => UiBlock) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? updater(b) : b)))
  }

  function moveBlock(index: number, direction: 'up' | 'down') {
    setBlocks((prev) => {
      const next = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      const tmp = next[targetIndex]
      next[targetIndex] = next[index]
      next[index] = tmp
      return next
    })
  }

  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index))
  }

  function addBlock() {
    setBlocks((prev) => [...prev, createDefaultBlock()])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave || saving) return
    setSaving(true)
    try {
      const payloadBlocks = blocks.map((b, index) => ({
        id: b.id,
        sort_order: index,
        title: b.title || 'Блок',
        block_type: b.block_type,
        is_required: b.is_required,
        config: b.config ?? null,
      }))

      if (isNew) {
        const deed = await api.deeds.create({
          emoji: emoji || '📋',
          name: name.trim(),
          description: description.trim() || undefined,
          blocks: payloadBlocks,
        })
        toast.success('Дело создано')
        navigate(`/deeds/${deed.id}`)
      } else if (id) {
        await api.deeds.update(id, {
          emoji: emoji || '📋',
          name: name.trim(),
          description: description.trim() || undefined,
          blocks: payloadBlocks,
        })
        toast.success('Дело сохранено')
        navigate(`/deeds/${id}`)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка сохранения дела'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to={id ? `/deeds/${id}` : '/'} aria-label="Назад">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {isNew ? 'Новое дело' : 'Редактирование дела'}
        </h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="w-20">
                <Label htmlFor="emoji">Эмодзи</Label>
                <Input
                  id="emoji"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
                  className="text-2xl"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например, Утренняя зарядка"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Для чего эта форма, как её заполнять"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Блоки вопрос-ответ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground text-sm">Загрузка…</p>
            ) : (
              <>
                {blocks.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    Пока нет блоков. Добавьте первый.
                  </p>
                )}
                <div className="space-y-4">
                  {blocks.map((block, index) => (
                    <div
                      key={block.id ?? index}
                      className="rounded-lg border p-4 space-y-3 bg-card/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Блок {index + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={index === 0}
                            onClick={() => moveBlock(index, 'up')}
                            aria-label="Выше"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={index === blocks.length - 1}
                            onClick={() => moveBlock(index, 'down')}
                            aria-label="Ниже"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBlock(index)}
                            aria-label="Удалить блок"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_auto] items-start">
                        <div className="space-y-1.5">
                          <Label>Вопрос</Label>
                          <Input
                            value={block.title}
                            onChange={(e) =>
                              updateBlock(index, (b) => ({
                                ...b,
                                title: e.target.value,
                              }))
                            }
                            placeholder="Например, Количество приседаний"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Тип</Label>
                          <Select
                            value={block.block_type}
                            onValueChange={(nextType) => {
                              updateBlock(index, (b) => {
                                let nextConfig: BlockConfig | null = b.config
                                if (nextType === 'scale') {
                                  nextConfig = createDefaultScaleConfig()
                                } else if (
                                  nextType === 'single_select' ||
                                  nextType === 'multi_select'
                                ) {
                                  nextConfig =
                                    b.config?.options &&
                                    b.config.options.length > 0
                                      ? {
                                          options: [...b.config.options],
                                        }
                                      : createDefaultSelectConfig()
                                } else {
                                  nextConfig = null
                                }
                                return {
                                  ...b,
                                  block_type: nextType as BlockType,
                                  config: nextConfig,
                                }
                              })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Тип блока" />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(BLOCK_TYPE_LABEL) as BlockType[]).map(
                                (t) => (
                                  <SelectItem key={t} value={t}>
                                    {BLOCK_TYPE_LABEL[t]}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <Checkbox
                            id={`required-${index}`}
                            checked={block.is_required}
                            onCheckedChange={(checked) =>
                              updateBlock(index, (b) => ({
                                ...b,
                                is_required: checked === true,
                              }))
                            }
                          />
                          <Label htmlFor={`required-${index}`} className="cursor-pointer">
                            Обязательное значение
                          </Label>
                        </div>
                      </div>

                      {block.block_type === 'scale' && (
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                          <div className="space-y-1.5">
                            <Label>Делений (1–10)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              value={block.config?.divisions ?? 5}
                              onChange={(e) =>
                                updateBlock(index, (b) => ({
                                  ...b,
                                  config: {
                                    ...(b.config ?? {}),
                                    divisions: Math.min(
                                      10,
                                      Math.max(1, Number(e.target.value) || 1),
                                    ),
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Подпись слева</Label>
                            <Input
                              value={block.config?.labelLeft ?? ''}
                              onChange={(e) =>
                                updateBlock(index, (b) => ({
                                  ...b,
                                  config: {
                                    ...(b.config ?? {}),
                                    labelLeft: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Подпись справа</Label>
                            <Input
                              value={block.config?.labelRight ?? ''}
                              onChange={(e) =>
                                updateBlock(index, (b) => ({
                                  ...b,
                                  config: {
                                    ...(b.config ?? {}),
                                    labelRight: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      )}

                      {(block.block_type === 'single_select' ||
                        block.block_type === 'multi_select') && (
                        <div className="space-y-2">
                          <Label>Варианты ответа</Label>
                          <div className="space-y-2">
                            {(block.config?.options ?? []).map(
                              (opt, optIndex) => (
                                <div
                                  key={opt.id}
                                  className="flex items-center gap-2"
                                >
                                  <Input
                                    value={opt.label}
                                    onChange={(e) =>
                                      updateBlock(index, (b) => {
                                        const nextOptions =
                                          b.config?.options
                                            ? [...b.config.options]
                                            : []
                                        nextOptions[optIndex] = {
                                          ...nextOptions[optIndex],
                                          label: e.target.value,
                                        }
                                        return {
                                          ...b,
                                          config: {
                                            ...(b.config ?? {}),
                                            options: nextOptions,
                                          },
                                        }
                                      })
                                    }
                                    placeholder={`Вариант ${optIndex + 1}`}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={optIndex === 0}
                                    onClick={() =>
                                      updateBlock(index, (b) => {
                                        const nextOptions =
                                          b.config?.options
                                            ? [...b.config.options]
                                            : []
                                        if (optIndex === 0) return b
                                        const tmp =
                                          nextOptions[optIndex - 1]
                                        nextOptions[optIndex - 1] =
                                          nextOptions[optIndex]
                                        nextOptions[optIndex] = tmp
                                        return {
                                          ...b,
                                          config: {
                                            ...(b.config ?? {}),
                                            options: nextOptions.map(
                                              (o, i) => ({
                                                ...o,
                                                sort_order: i,
                                              }),
                                            ),
                                          },
                                        }
                                      })
                                    }
                                    aria-label="Выше"
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={
                                      optIndex ===
                                      (block.config?.options?.length ?? 1) - 1
                                    }
                                    onClick={() =>
                                      updateBlock(index, (b) => {
                                        const nextOptions =
                                          b.config?.options
                                            ? [...b.config.options]
                                            : []
                                        if (
                                          optIndex ===
                                          nextOptions.length - 1
                                        )
                                          return b
                                        const tmp =
                                          nextOptions[optIndex + 1]
                                        nextOptions[optIndex + 1] =
                                          nextOptions[optIndex]
                                        nextOptions[optIndex] = tmp
                                        return {
                                          ...b,
                                          config: {
                                            ...(b.config ?? {}),
                                            options: nextOptions.map(
                                              (o, i) => ({
                                                ...o,
                                                sort_order: i,
                                              }),
                                            ),
                                          },
                                        }
                                      })
                                    }
                                    aria-label="Ниже"
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      updateBlock(index, (b) => {
                                        const nextOptions =
                                          b.config?.options
                                            ? b.config.options.filter(
                                                (_, i) =>
                                                  i !== optIndex,
                                              )
                                            : []
                                        return {
                                          ...b,
                                          config: {
                                            ...(b.config ?? {}),
                                            options: nextOptions.map(
                                              (o, i) => ({
                                                ...o,
                                                sort_order: i,
                                              }),
                                            ),
                                          },
                                        }
                                      })
                                    }
                                    aria-label="Удалить вариант"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              ),
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateBlock(index, (b) => {
                                const current =
                                  b.config?.options ?? []
                                const next = [
                                  ...current,
                                  {
                                    id: createOptionId(),
                                    label: `Вариант ${current.length + 1}`,
                                    sort_order: current.length,
                                  },
                                ]
                                return {
                                  ...b,
                                  config: {
                                    ...(b.config ?? {}),
                                    options: next,
                                  },
                                }
                              })
                            }
                          >
                            Добавить вариант
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addBlock}
                  className="mt-2"
                >
                  + Добавить блок
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={!canSave || saving}>
            {saving ? 'Сохранение…' : isNew ? 'Создать' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </div>
  )
}
