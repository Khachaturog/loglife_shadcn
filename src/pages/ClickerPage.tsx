import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Flex, Select, Text } from '@radix-ui/themes'
import { AppBar } from '@/components/AppBar'
import { api } from '@/lib/api'
import { todayLocalISO, nowTimeLocal } from '@/lib/format-utils'
import type { BlockRow, DeedWithBlocks } from '@/types/database'
import styles from './ClickerPage.module.css'

const HOLD_DELAY_MS = 400
const HOLD_INTERVAL_MS = 80

/** Дела, у которых ровно один блок типа number */
function deedsWithSingleNumberBlock(deeds: DeedWithBlocks[]): DeedWithBlocks[] {
  return deeds.filter((d) => {
    const blocks = (d.blocks ?? []).filter((b: BlockRow) => !b.deleted_at)
    return blocks.length === 1 && blocks[0].block_type === 'number'
  })
}

/**
 * Страница виджета «Кликер».
 * Счётчик с сохранением в дело с одним блоком «Число».
 */
export function ClickerPage() {
  // --- Состояние ---
  const [deeds, setDeeds] = useState<DeedWithBlocks[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDeedId, setSelectedDeedId] = useState<string>('')
  const [count, setCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // --- Загрузка дел ---
  useEffect(() => {
    let cancelled = false
    api.deeds
      .listWithBlocks()
      .then((data) => {
        if (!cancelled) setDeeds(data)
      })
      .catch(() => {
        if (!cancelled) setDeeds([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // --- Вычисляемые данные ---
  const clickerDeeds = useMemo(() => deedsWithSingleNumberBlock(deeds), [deeds])
  const selectedDeed = useMemo(
    () => clickerDeeds.find((d) => d.id === selectedDeedId) ?? null,
    [clickerDeeds, selectedDeedId],
  )
  const numberBlock = selectedDeed?.blocks?.[0] ?? null

  const clearHoldTimers = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
  }

  useEffect(() => {
    return () => clearHoldTimers()
  }, [])

  const handlePointerDown = () => {
    setCount((c) => c + 1)
    holdTimeoutRef.current = setTimeout(() => {
      holdTimeoutRef.current = null
      holdIntervalRef.current = setInterval(() => {
        setCount((c) => c + 1)
      }, HOLD_INTERVAL_MS)
    }, HOLD_DELAY_MS)
  }

  const handlePointerUp = () => {
    clearHoldTimers()
  }

  const handleSave = async () => {
    if (!selectedDeedId || !numberBlock || saving) return
    setSaving(true)
    try {
      await api.deeds.createRecord(selectedDeedId, {
        record_date: todayLocalISO(),
        record_time: nowTimeLocal(),
        answers: { [numberBlock.id]: { number: count } },
      })
      setCount(0)
    } catch (err) {
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

  return (
    <Box p="4" className={styles.container}>
      <AppBar backHref="/widgets" title="Кликер" />

      {/* Выбор дела: только с одним блоком «Число» */}
      <Flex direction="column" gap="2" mb="4" mt="2">
        <Text size="2" weight="medium">
          Дело
        </Text>
        <Text size="1" color="gray">
          Доступны дела только с одним блоком «Число»
        </Text>
        <Select.Root
          value={selectedDeedId || undefined}
          onValueChange={(v) => {
            setSelectedDeedId(v)
            setCount(0)
          }}
        >
          <Select.Trigger id="deed-select" placeholder="Выберите дело" />
          <Select.Content>
            {clickerDeeds.map((d) => (
              <Select.Item key={d.id} value={d.id}>
                {d.emoji} {d.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Flex>

      {clickerDeeds.length === 0 && !loading && (
        <Text as="p" color="gray" mb="4">
          Нет подходящих дел. Создайте дело с одним блоком «Число».
        </Text>
      )}

      {selectedDeed && (
        <Flex direction="column" gap="4">
          {/* Область счётчика: клик или удержание для инкремента */}
          <Box
            asChild
            className={styles.counterArea}
          >
            <div
              role="button"
              tabIndex={0}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onContextMenu={(e) => e.preventDefault()}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  setCount((c) => c + 1)
                }
              }}
            >
              {count}
            </div>
          </Box>
          <Button size="3" onClick={handleSave} disabled={saving || count === 0}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </Flex>
      )}
    </Box>
  )
}
