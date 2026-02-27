import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Box, Button, Checkbox, Flex, Heading, RadioGroup, Select, Text, TextArea, TextField } from '@radix-ui/themes'
import { AppBar } from '@/components/AppBar'
import { Pencil1Icon } from '@radix-ui/react-icons'
import { api } from '@/lib/api'
import type { BlockConfig, BlockRow, DeedWithBlocks, RecordAnswerRow, RecordWithAnswers, ValueJson } from '@/types/database'
import { DatePicker } from '@/components/DatePicker'
import { DurationInput } from '@/components/DurationInput'
import { formatAnswer } from '@/lib/format-utils'
import styles from './RecordViewPage.module.css'

function getBlockOptions(block: BlockRow): { id: string; label: string }[] {
  const fromConfig = (block.config as BlockConfig | null)?.options
  if (fromConfig?.length) return fromConfig.map((o) => ({ id: o.id, label: o.label }))
  return []
}

type ConfigVersionData = { scale?: { divisions: number; labels: (string | null)[] }; options?: { id: string; label: string; sort_order: number }[] }

function isConfigOutdated(block: BlockRow | null, versionConfig: ConfigVersionData | null): boolean {
  if (!block) return true
  if (!versionConfig) return false
  const cfg = block.config as BlockConfig | null
  if (versionConfig.scale) {
    const d = Math.min(10, Math.max(1, Number(cfg?.divisions ?? 5)))
    const curr = (cfg?.labels ?? []).slice(0, d)
    const vers = versionConfig.scale.labels
    if (Number(versionConfig.scale.divisions) !== d || curr.length !== vers.length) return true
    return !curr.every((c, i) => (c ?? '') === (vers[i] ?? ''))
  }
  if (versionConfig.options) {
    const current = getBlockOptions(block)
    if (current.length !== versionConfig.options.length) return true
    return !versionConfig.options.every((o, i) => current[i]?.id === o.id && current[i]?.label === o.label)
  }
  return false
}

function formatScaleConfig(cfg: ConfigVersionData['scale']): string {
  if (!cfg) return ''
  const parts: string[] = [String(cfg.divisions)]
  const first = cfg.labels[0] ?? ''
  const last = cfg.labels[cfg.divisions - 1] ?? ''
  if (first || last) parts.push(`${first || '…'} — ${last || '…'}`)
  return parts.join(' · ')
}

export function RecordViewPage() {
  const { id: recordId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const fromHistory = (location.state as { from?: string } | null)?.from === 'history'
  const [record, setRecord] = useState<RecordWithAnswers | null>(null)
  const [deed, setDeed] = useState<DeedWithBlocks | null>(null)
  const [configByVersion, setConfigByVersion] = useState<Record<string, ConfigVersionData>>({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [recordDate, setRecordDate] = useState('')
  const [recordTime, setRecordTime] = useState('')
  const [answers, setAnswers] = useState<Record<string, ValueJson>>({})
  const [updateDraft, setUpdateDraft] = useState<Record<string, ValueJson>>({})
  const [savingOutdated, setSavingOutdated] = useState(false)

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
        const ans: Record<string, ValueJson> = {}
        for (const a of rec.record_answers ?? []) ans[a.block_id] = a.value_json
        setAnswers(ans)
        return rec
      })
      .then(async (rec) => {
        if (!rec || cancelled) return
        const deedId = rec.deed_id
        const [d, configMap] = await Promise.all([
          api.deeds.get(deedId, { includeDeletedBlocks: true }),
          (() => {
            const ids = (rec.record_answers ?? [])
              .map((a) => (a as RecordAnswerRow & { config_version_id?: string | null }).config_version_id)
              .filter((v): v is string => !!v)
            return ids.length ? api.records.getConfigForVersions(ids) : Promise.resolve({})
          })(),
        ])
        if (!cancelled && d) setDeed(d)
        if (!cancelled) setConfigByVersion(configMap)
      })
      .catch((e) => {
        if (!cancelled) {
          console.error(e?.message ?? 'Ошибка загрузки записи')
          navigate('/', { replace: true })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [recordId, navigate])

  const blocks = deed?.blocks ?? []
  const blocksById = Object.fromEntries((deed?.blocks ?? []).map((b) => [b.id, b]))
  const answersByBlockId = record?.record_answers?.reduce(
    (acc, a) => ({ ...acc, [a.block_id]: a }),
    {} as Record<string, RecordAnswerRow & { config_version_id?: string | null }>,
  ) ?? {}

  const outdatedAnswers = (() => {
    const outdated: { block: BlockRow | null; ans: RecordAnswerRow; title: string; optionsOverride?: { id: string; label: string }[] }[] = []
    for (const a of record?.record_answers ?? []) {
      const ans = a as RecordAnswerRow & { config_version_id?: string | null }
      const block = blocksById[ans.block_id] ?? null
      const versionConfig = ans.config_version_id ? configByVersion[ans.config_version_id] : null
      const blockDeleted = block?.deleted_at != null
      const out = !block || blockDeleted || isConfigOutdated(block, versionConfig)
      const optionsOverride = versionConfig?.options?.map((o) => ({ id: o.id, label: o.label }))
      const title = block?.title ?? 'Блок'
      if (out) outdated.push({ block, ans, title, optionsOverride })
    }
    return outdated
  })()

  async function handleSave() {
    if (!recordId || !record) return
    setSaving(true)
    try {
      await api.records.update(recordId, { record_date: recordDate, record_time: recordTime, answers })
      const updated = await api.records.get(recordId)
      if (updated) {
        setRecord(updated)
        const ans: Record<string, ValueJson> = {}
        for (const a of updated.record_answers ?? []) ans[a.block_id] = a.value_json
        setAnswers(ans)
        const versionIds = (updated.record_answers ?? [])
          .map((a) => (a as RecordAnswerRow & { config_version_id?: string | null }).config_version_id)
          .filter((v): v is string => !!v)
        const configMap = versionIds.length ? await api.records.getConfigForVersions(versionIds) : {}
        setConfigByVersion(configMap)
      }
      setEditing(false)
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  function setAnswer(blockId: string, value: ValueJson) {
    setAnswers((prev) => ({ ...prev, [blockId]: value }))
  }

  async function handleDelete() {
    if (!recordId) return
    if (!confirm('Удалить запись?')) return
    await api.records.delete(recordId)
    navigate(backLink)
  }

  function getMigratedValue(block: BlockRow, oldVal: ValueJson | undefined): ValueJson | undefined {
    if (!oldVal) return undefined
    const currentOptions = getBlockOptions(block)
    const divisions = Math.min(10, Math.max(1, (block.config as BlockConfig | null)?.divisions ?? 5))
    if (block.block_type === 'single_select' && 'optionId' in oldVal && currentOptions.some((o) => o.id === (oldVal as { optionId?: string }).optionId))
      return { optionId: (oldVal as { optionId: string }).optionId }
    if (block.block_type === 'multi_select' && 'optionIds' in oldVal && Array.isArray((oldVal as { optionIds: string[] }).optionIds)) {
      const ids = (oldVal as { optionIds: string[] }).optionIds.filter((id) => currentOptions.some((o) => o.id === id))
      return ids.length > 0 ? { optionIds: ids } : undefined
    }
    if (block.block_type === 'scale' && 'scaleValue' in oldVal) {
      const n = (oldVal as { scaleValue: number }).scaleValue
      return n >= 1 && n <= divisions ? { scaleValue: n } : undefined
    }
    return undefined
  }

  function isDraftValidForBlock(block: BlockRow, draft: ValueJson | undefined): boolean {
    if (draft == null) return false
    switch (block.block_type) {
      case 'number':
        return typeof (draft as { number?: number }).number === 'number'
      case 'text_short':
      case 'text_paragraph':
        return typeof (draft as { text?: string }).text === 'string'
      case 'single_select':
        return typeof (draft as { optionId?: string }).optionId === 'string'
      case 'multi_select':
        return Array.isArray((draft as { optionIds?: string[] }).optionIds)
      case 'scale':
        return typeof (draft as { scaleValue?: number }).scaleValue === 'number'
      case 'yes_no':
        return typeof (draft as { yesNo?: boolean }).yesNo === 'boolean'
      case 'duration':
        return typeof (draft as { durationHms?: string }).durationHms === 'string'
      default:
        return false
    }
  }

  const nonDeletedBlocks = blocks.filter((b) => !b.deleted_at)
  const unfilledBlocksList = nonDeletedBlocks.filter((block) => !answersByBlockId[block.id])
  const outdatedBlocksList = nonDeletedBlocks.filter((block) => {
    const ans = answersByBlockId[block.id] as (RecordAnswerRow & { config_version_id?: string | null }) | undefined
    const versionConfig = ans?.config_version_id ? configByVersion[ans.config_version_id] : null
    return !!(ans && isConfigOutdated(block, versionConfig))
  })
  const hasOutdatedBlocks = outdatedBlocksList.length > 0
  const hasUnfilledBlocks = unfilledBlocksList.length > 0
  const hasBlocksToUpdate = hasOutdatedBlocks || hasUnfilledBlocks
  const hasAnyValidDraft =
    (hasOutdatedBlocks &&
      outdatedBlocksList.some((block) => {
        const value = answersByBlockId[block.id]?.value_json
        const effectiveDraft = updateDraft[block.id] ?? getMigratedValue(block, value as ValueJson | undefined)
        return isDraftValidForBlock(block, effectiveDraft)
      })) ||
    (hasUnfilledBlocks && unfilledBlocksList.some((block) => isDraftValidForBlock(block, updateDraft[block.id])))

  async function handleUpdateAllOutdated() {
    if (!recordId || !record) return
    const currentAnswers: Record<string, ValueJson> = {}
    for (const a of record.record_answers ?? []) currentAnswers[a.block_id] = a.value_json
    const merged = { ...currentAnswers }
    const toSave: string[] = []
    for (const block of outdatedBlocksList) {
      const value = answersByBlockId[block.id]?.value_json as ValueJson | undefined
      const effectiveDraft = updateDraft[block.id] ?? getMigratedValue(block, value)
      if (!isDraftValidForBlock(block, effectiveDraft)) continue
      merged[block.id] = effectiveDraft
      toSave.push(block.id)
    }
    for (const block of unfilledBlocksList) {
      const draft = updateDraft[block.id]
      if (!isDraftValidForBlock(block, draft)) continue
      merged[block.id] = draft!
      toSave.push(block.id)
    }
    if (toSave.length === 0) return
    setSavingOutdated(true)
    try {
      await api.records.update(recordId, { answers: merged })
      const updated = await api.records.get(recordId)
      if (updated) {
        setRecord(updated)
        const versionIds = (updated.record_answers ?? [])
          .map((a) => (a as RecordAnswerRow & { config_version_id?: string | null }).config_version_id)
          .filter((v): v is string => !!v)
        const configMap = versionIds.length ? await api.records.getConfigForVersions(versionIds) : {}
        setConfigByVersion(configMap)
      }
      setUpdateDraft((prev) => {
        const next = { ...prev }
        for (const id of toSave) delete next[id]
        return next
      })
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : 'Ошибка актуализации')
    } finally {
      setSavingOutdated(false)
    }
  }

  function setUpdateDraftValue(blockId: string, value: ValueJson) {
    setUpdateDraft((prev) => ({ ...prev, [blockId]: value }))
  }

  if (loading) {
    return (
      <Box p="4">
        <Text>Загрузка…</Text>
      </Box>
    )
  }

  const backLink = fromHistory ? '/history' : (record?.deed_id ? `/deeds/${record.deed_id}` : '/')

  if (!record) {
    return (
      <Box p="4">
        <AppBar backHref={backLink} />
        <Text as="p" color="crimson" mt="2">
          Запись не найдена.
        </Text>
      </Box>
    )
  }

  return (
    <Box p="4" className={styles.container}>
      <AppBar backHref={backLink} title={`${record.record_date} ${record.record_time?.slice(0, 5) ?? ''}`} />

      <Flex gap="2" mb="4" mt="2" wrap="wrap">
        {!editing ? (
          <>
            <Button variant="soft" onClick={() => setEditing(true)}>
              <Pencil1Icon /> Редактировать
            </Button>
            <Button variant="soft" color="red" onClick={handleDelete}>Удалить</Button>
            {hasBlocksToUpdate && (
              <Button
                variant="soft"
                disabled={!hasAnyValidDraft || savingOutdated}
                onClick={handleUpdateAllOutdated}
              >
                {savingOutdated ? 'Сохранение…' : 'Актуализировать'}
              </Button>
            )}
          </>
        ) : (
          <>
            <Button variant="soft" onClick={() => setEditing(false)}>Отмена</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </>
        )}
      </Flex>

      {editing ? (
        <Flex direction="column" gap="4">
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

          {blocks.filter((b) => !b.deleted_at).map((block) => (
            <Flex key={block.id} direction="column" gap="1">
              <Text size="2" weight="medium">{block.title}</Text>
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
                <Flex gap="2" wrap="wrap">
                  {Array.from({ length: Math.min(10, Math.max(1, (block.config as BlockConfig | null)?.divisions ?? 5)) }, (_, i) => i + 1).map((n) => (
                    <Button key={n} type="button" variant="soft" size="2" onClick={() => setAnswer(block.id, { scaleValue: n })}>{n}</Button>
                  ))}
                </Flex>
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
        </Flex>
      ) : (
        <Flex direction="column" gap="4">
          <Text size="2" color="gray">
            Дата: {record.record_date} {record.record_time?.slice(0, 5)}
          </Text>
          {blocks.filter((b) => !b.deleted_at).map((block) => {
            const ans = answersByBlockId[block.id] as (RecordAnswerRow & { config_version_id?: string | null }) | undefined
            const versionConfig = ans?.config_version_id ? configByVersion[ans.config_version_id] : null
            const outdated = ans && isConfigOutdated(block, versionConfig)
            const unfilled = !ans
            const value = ans?.value_json
            const optionsOverride = versionConfig?.options?.map((o) => ({ id: o.id, label: o.label }))

            if (!outdated && !unfilled) {
              return (
                <Box key={block.id}>
                  <Text weight="bold" size="2">{block.title}</Text>
                  <Text as="p" size="2">{value ? formatAnswer(value, block, optionsOverride) : '—'}</Text>
                </Box>
              )
            }

            const currentOptions = getBlockOptions(block)
            const divisions = Math.min(10, Math.max(1, (block.config as BlockConfig | null)?.divisions ?? 5))
            const labels = (block.config as BlockConfig | null)?.labels ?? []
            const oldVal = value as ValueJson | undefined
            const draft = updateDraft[block.id] ?? (unfilled ? undefined : getMigratedValue(block, oldVal))

            return (
              <Box key={block.id}>
                <Text weight="bold" size="2">{block.title}{outdated ? ' (устарело)' : unfilled ? ' (не заполнено)' : ''}</Text>
                <Text as="p" size="2">{value ? formatAnswer(value, block, optionsOverride) : '—'}</Text>
                <Flex direction="column" gap="2" mt="2">
                  <Text weight="medium" size="2">Актуальные варианты</Text>
                  {block.block_type === 'number' && (
                    <TextField.Root
                      type="number"
                      value={(draft as { number?: number } | undefined)?.number ?? ''}
                      onChange={(e) => setUpdateDraftValue(block.id, { number: Number(e.target.value) || 0 })}
                    />
                  )}
                  {block.block_type === 'text_short' && (
                    <TextField.Root
                      value={(draft as { text?: string } | undefined)?.text ?? ''}
                      onChange={(e) => setUpdateDraftValue(block.id, { text: e.target.value })}
                    />
                  )}
                  {block.block_type === 'text_paragraph' && (
                    <TextArea
                      value={(draft as { text?: string } | undefined)?.text ?? ''}
                      onChange={(e) => setUpdateDraftValue(block.id, { text: e.target.value })}
                    />
                  )}
                  {block.block_type === 'single_select' && (
                    <Select.Root
                      value={(draft as { optionId?: string } | undefined)?.optionId || undefined}
                      onValueChange={(v) => setUpdateDraftValue(block.id, { optionId: v })}
                    >
                      <Select.Trigger placeholder="Выберите" />
                      <Select.Content>
                        {currentOptions.map((opt) => (
                          <Select.Item key={opt.id} value={opt.id}>{opt.label}</Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  )}
                  {block.block_type === 'multi_select' && (
                    <Flex direction="column" gap="2">
                      {currentOptions.map((opt) => {
                        const current = (draft as { optionIds?: string[] } | undefined)?.optionIds ?? []
                        return (
                          <Text as="label" key={opt.id} size="2" className={styles.checkboxLabel}>
                            <Checkbox
                              checked={current.includes(opt.id)}
                              onCheckedChange={(checked) => {
                                const next = checked ? [...current, opt.id] : current.filter((id) => id !== opt.id)
                                setUpdateDraftValue(block.id, { optionIds: next })
                              }}
                            />
                            {opt.label}
                          </Text>
                        )
                      })}
                    </Flex>
                  )}
                  {block.block_type === 'scale' && (
                    <Flex gap="2" wrap="wrap">
                      {Array.from({ length: divisions }, (_, i) => i + 1).map((n) => (
                        <Button
                          key={n}
                          type="button"
                          variant="soft"
                          size="2"
                          onClick={() => setUpdateDraftValue(block.id, { scaleValue: n })}
                        >
                          {labels[n - 1] ?? n}
                        </Button>
                      ))}
                    </Flex>
                  )}
                  {block.block_type === 'duration' && (
                    <DurationInput
                      value={(draft as { durationHms?: string } | undefined)?.durationHms ?? ''}
                      onChange={(hms) => setUpdateDraftValue(block.id, { durationHms: hms })}
                      placeholder="00:00:00"
                    />
                  )}
                  {block.block_type === 'yes_no' && (
                    <RadioGroup.Root
                      value={
                        (draft as { yesNo?: boolean } | undefined)?.yesNo === true
                          ? 'true'
                          : (draft as { yesNo?: boolean } | undefined)?.yesNo === false
                            ? 'false'
                            : ''
                      }
                      onValueChange={(v) => setUpdateDraftValue(block.id, { yesNo: v === 'true' })}
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
              </Box>
            )
          })}
          {outdatedAnswers.filter(({ block }) => block?.deleted_at != null).length > 0 && (
            <Box py="3" className={styles.sectionDivider}>
              <Heading size="3" mb="2">Удалённые блоки</Heading>
              {outdatedAnswers
                .filter(({ block }) => block?.deleted_at != null)
                .map(({ block, ans, title, optionsOverride }) => {
                  const versionConfig = (ans as RecordAnswerRow & { config_version_id?: string | null }).config_version_id
                    ? configByVersion[(ans as RecordAnswerRow & { config_version_id?: string | null }).config_version_id!]
                    : null
                  const scaleConfig = versionConfig?.scale
                  const configStr = scaleConfig ? formatScaleConfig(scaleConfig) : null
                  return (
                    <Box key={ans.id} mb="2">
                      <Text weight="bold" size="2">{title}</Text>
                      <Text as="p" size="2">{ans.value_json ? formatAnswer(ans.value_json, block ?? ({} as BlockRow), optionsOverride) : '—'}</Text>
                      {configStr && <Text as="p" size="1" color="gray">Конфиг: {configStr}</Text>}
                      <Text as="p" size="1" color="gray">Блок удалён</Text>
                    </Box>
                  )
                })}
            </Box>
          )}
        </Flex>
      )}
    </Box>
  )
}
