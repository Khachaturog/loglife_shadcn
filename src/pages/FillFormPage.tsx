import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Button, Checkbox, Flex, RadioGroup, Select, SegmentedControl, Text, TextArea, TextField } from '@radix-ui/themes'
import { AppBar } from '@/components/AppBar'
import { api } from '@/lib/api'
import { DatePicker } from '@/components/DatePicker'
import { DurationInput } from '@/components/DurationInput'
import { todayLocalISO, nowTimeLocal } from '@/lib/format-utils'
import type { BlockConfig, BlockRow, DeedWithBlocks, ValueJson } from '@/types/database'
import styles from './FillFormPage.module.css'

function getBlockOptions(block: BlockRow): { id: string; label: string }[] {
  const fromConfig = (block.config as BlockConfig | null)?.options
  if (fromConfig?.length) return fromConfig.map((o) => ({ id: o.id, label: o.label }))
  return []
}

/**
 * Страница добавления записи к делу.
 * Форма с полями по блокам дела (число, текст, выбор, шкала, да/нет, время и т.д.).
 */
export function FillFormPage() {
  const { id: deedId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // --- Состояние ---
  const [deed, setDeed] = useState<DeedWithBlocks | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [recordDate, setRecordDate] = useState(todayLocalISO())
  const [recordTime, setRecordTime] = useState(nowTimeLocal())
  const [answers, setAnswers] = useState<Record<string, ValueJson>>({})

  // --- Загрузка дела ---
  useEffect(() => {
    if (!deedId) return
    let cancelled = false
    setLoading(true)
    api.deeds
      .get(deedId)
      .then((data) => { if (!cancelled) setDeed(data ?? null) })
      .catch((e) => {
        if (!cancelled) {
          console.error(e?.message ?? 'Ошибка загрузки дела')
          navigate('/', { replace: true })
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
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
      if ('durationHms' in v) {
        const hms = (v as { durationHms?: string }).durationHms ?? ''
        if (hms.length < 8 || !/^\d{2}:\d{2}:\d{2}$/.test(hms)) return true
      }
    }
    return false
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
        answers: Object.keys(answers).length ? answers : undefined,
      })
      navigate(-1)
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  // --- Рендер ---
  if (loading) {
    return (
      <Box p="4">
        <Text>Загрузка…</Text>
      </Box>
    )
  }

  if (!deed) {
    return (
      <Box p="4">
        <AppBar onBack={() => navigate(-1)} />
        <Text as="p" color="crimson" mt="2">
          Дело не найдено.
        </Text>
      </Box>
    )
  }

  return (
    <Box p="4" className={styles.container}>
      <AppBar onBack={() => navigate(-1)} title={`${deed.emoji} ${deed.name}`} />

      {deed.description && (
        <Text as="p" size="2" color="gray" mb="4" mt="2">
          {deed.description}
        </Text>
      )}

      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="4">
          {/* Дата и время */}
          <Flex gap="3" wrap="wrap">
            <Flex direction="column" gap="1" className={styles.dateTimeField}>
              <Text size="2" weight="medium">Дата</Text>
              <DatePicker value={recordDate} onChange={setRecordDate} />
            </Flex>
            <Flex direction="column" gap="1" className={styles.dateTimeField}>
              <Text size="2" weight="medium">Время</Text>
              <TextField.Root
                type="time"
                value={recordTime}
                onChange={(e) => setRecordTime(e.target.value)}
              />
            </Flex>
          </Flex>

          {/* Поля по блокам */}
          {blocks.map((block) => (
            <Flex key={block.id} direction="column" gap="1">
              <Text size="2" weight="medium">
                {block.title}{block.is_required && ' *'}
              </Text>
              {block.block_type === 'number' && (
                <TextField.Root
                  type="number"
                  value={(answers[block.id] as { number?: number } | undefined)?.number ?? ''}
                  onChange={(e) => setAnswer(block.id, { number: Number(e.target.value) || 0 })}
                />
              )}
              {block.block_type === 'text_short' && (
                <TextField.Root
                  value={(answers[block.id] as { text?: string } | undefined)?.text ?? ''}
                  onChange={(e) => setAnswer(block.id, { text: e.target.value })}
                />
              )}
              {block.block_type === 'text_paragraph' && (
                <TextArea
                  value={(answers[block.id] as { text?: string } | undefined)?.text ?? ''}
                  onChange={(e) => setAnswer(block.id, { text: e.target.value })}
                  placeholder=""
                  className={styles.textArea}
                />
              )}
              {block.block_type === 'single_select' && (
                <Select.Root
                  value={(answers[block.id] as { optionId?: string } | undefined)?.optionId || undefined}
                  onValueChange={(v) => setAnswer(block.id, { optionId: v })}
                >
                  <Select.Trigger placeholder="Выберите" />
                  <Select.Content>
                    {getBlockOptions(block).map((opt) => (
                      <Select.Item key={opt.id} value={opt.id}>{opt.label}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              )}
              {block.block_type === 'multi_select' && (
                <Flex direction="column" gap="2">
                  {getBlockOptions(block).map((opt) => {
                    const current = (answers[block.id] as { optionIds?: string[] } | undefined)?.optionIds ?? []
                    return (
                      <Text as="label" key={opt.id} size="2" className={styles.checkboxLabel}>
                        <Checkbox
                          checked={current.includes(opt.id)}
                          onCheckedChange={(checked) => {
                            const next = checked ? [...current, opt.id] : current.filter((id) => id !== opt.id)
                            setAnswer(block.id, { optionIds: next })
                          }}
                        />
                        {opt.label}
                      </Text>
                    )
                  })}
                </Flex>
              )}
              {block.block_type === 'scale' && (
                <SegmentedControl.Root
                  value={
                    (answers[block.id] as { scaleValue?: number } | undefined)?.scaleValue?.toString()
                  }
                  onValueChange={(v) => setAnswer(block.id, { scaleValue: Number(v) })}
                  size="2"
                >
                  {Array.from(
                    { length: Math.min(10, Math.max(1, (block.config as BlockConfig | null)?.divisions ?? 5)) },
                    (_, i) => i + 1
                  ).map((n) => (
                    <SegmentedControl.Item key={n} value={String(n)}>
                      {n}
                    </SegmentedControl.Item>
                  ))}
                </SegmentedControl.Root>
              )}
              {block.block_type === 'duration' && (
                <DurationInput
                  value={(answers[block.id] as { durationHms?: string } | undefined)?.durationHms ?? ''}
                  onChange={(hms) => setAnswer(block.id, { durationHms: hms })}
                  placeholder="00:00:00"
                />
              )}
              {block.block_type === 'yes_no' && (
                <RadioGroup.Root
                  value={
                    (answers[block.id] as { yesNo?: boolean } | undefined)?.yesNo === true
                      ? 'true'
                      : (answers[block.id] as { yesNo?: boolean } | undefined)?.yesNo === false
                        ? 'false'
                        : ''
                  }
                  onValueChange={(v) => setAnswer(block.id, { yesNo: v === 'true' })}
                >
                  <Flex gap="3">
                    <Text as="label" size="2" className={styles.checkboxLabel}>
                      <RadioGroup.Item value="true" />
                      Да
                    </Text>
                    <Text as="label" size="2" className={styles.checkboxLabel}>
                      <RadioGroup.Item value="false" />
                      Нет
                    </Text>
                  </Flex>
                </RadioGroup.Root>
              )}
            </Flex>
          ))}

          {requiredMissing && (
            <Text size="2" color="crimson">
              Заполните все обязательные поля.
            </Text>
          )}
          <Button type="submit" size="3" disabled={!canSubmit}>
            {saving ? 'Сохранение…' : 'Добавить запись'}
          </Button>
        </Flex>
      </form>
    </Box>
  )
}
