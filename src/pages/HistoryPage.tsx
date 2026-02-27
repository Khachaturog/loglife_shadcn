import { useEffect, useMemo, useState } from 'react'
import { Box, Flex, Heading, Text } from '@radix-ui/themes'
import { api } from '@/lib/api'
import { RecordCard } from '@/components/RecordCard'
import type { BlockRow, RecordRow } from '@/types/database'
import { formatDate, pluralRecords } from '@/lib/format-utils'
import styles from './HistoryPage.module.css'

type RecordWithDeed = (RecordRow & { record_answers?: { block_id: string; value_json: unknown }[] }) & {
  deed?: { emoji: string; name: string; blocks?: BlockRow[] }
}

/**
 * Страница истории записей.
 * Показывает все записи пользователя, сгруппированные по дате, с превью ответов.
 */
export function HistoryPage() {
  // --- Состояние ---
  const [recordsWithDeed, setRecordsWithDeed] = useState<RecordWithDeed[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Загрузка записей ---
  useEffect(() => {
    let cancelled = false
    api.deeds
      .listAllRecordsWithDeedInfo()
      .then((records) => {
        if (cancelled) return
        const all: RecordWithDeed[] = records.map((r) => {
          const row = r as { deeds?: { emoji: string; name: string; blocks?: BlockRow[] } | null; deed?: { emoji: string; name: string; blocks?: BlockRow[] } | null }
          const deedInfo = row.deeds ?? row.deed
          return {
            ...r,
            deed: deedInfo ? { emoji: deedInfo.emoji ?? '', name: deedInfo.name ?? '', blocks: deedInfo.blocks ?? [] } : undefined,
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
        if (!cancelled) {
          const msg = e?.message ?? ''
          if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
            setError('Нет связи с сервером. Проверьте интернет и что приложение может обращаться к Supabase.')
          } else {
            setError(msg || 'Ошибка загрузки')
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // --- Группировка по дате ---
  const byDate = useMemo(() => {
    const map = new Map<string, RecordWithDeed[]>()
    for (const r of recordsWithDeed) {
      const date = r.record_date
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(r)
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [recordsWithDeed])

  // --- Рендер состояний ---
  if (loading) {
    return (
      <Box p="4">
        <Text>Загрузка…</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Box p="4">
        <Text color="crimson">{error}</Text>
      </Box>
    )
  }

  // --- Основной контент ---
  return (
    <Box p="4" className={styles.container}>
      <Heading size="4" mb="4">
        История — {pluralRecords(recordsWithDeed.length)}
      </Heading>

      {byDate.length === 0 ? (
        <Text as="p" color="gray">
          Пока нет записей. Добавьте первую в любом деле.
        </Text>
      ) : (
        <Flex direction="column" gap="4">
          {byDate.map(([date, records]) => (
            <Box key={date}>
              <Text as="p" weight="medium" size="2" mb="2">
                {formatDate(date)} ({records.length})
              </Text>
              <Flex direction="column" gap="2">
                {records.map((rec) => (
                  <RecordCard
                    key={rec.id}
                    record={rec}
                    blocks={rec.deed?.blocks ?? []}
                    deedPrefix={rec.deed ? { emoji: rec.deed.emoji, name: rec.deed.name } : undefined}
                    linkState={{ from: 'history' }}
                  />
                ))}
              </Flex>
            </Box>
          ))}
        </Flex>
      )}
    </Box>
  )
}
