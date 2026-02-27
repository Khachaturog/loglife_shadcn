import { Link } from 'react-router-dom'
import { Card, Flex, Text } from '@radix-ui/themes'
import type { BlockRow, RecordRow, ValueJson } from '@/types/database'
import { formatAnswer, previewAnswer } from '@/lib/format-utils'
import styles from './RecordCard.module.css'

type RecordAnswer = { block_id: string; value_json: unknown }

type RecordCardProps = {
  /** Запись с ответами */
  record: RecordRow & { record_answers?: RecordAnswer[] }
  /** Блоки дела для форматирования ответов (по sort_order). Если нет — используется previewAnswer */
  blocks?: BlockRow[]
  /** Префикс «дело» для страницы истории: эмодзи и название */
  deedPrefix?: { emoji: string; name: string }
  /** state для Link (например { from: 'history' }) */
  linkState?: Record<string, string>
}

/**
 * Карточка записи в списке.
 * Единый дизайн для страницы истории и просмотра дела.
 * Клик — переход на просмотр записи.
 */
export function RecordCard({ record, blocks = [], deedPrefix, linkState }: RecordCardProps) {
  const sortedAnswers = [...(record.record_answers ?? [])].sort((a, b) => {
    const blockA = blocks.find((x) => x.id === a.block_id)
    const blockB = blocks.find((x) => x.id === b.block_id)
    const orderA = blockA?.sort_order ?? 0
    const orderB = blockB?.sort_order ?? 0
    return orderA - orderB
  })

  const preview = sortedAnswers
    .map((a) => {
      const block = blocks.find((b) => b.id === a.block_id)
      return block ? formatAnswer(a.value_json as ValueJson, block) : previewAnswer(a.value_json as ValueJson)
    })
    .join(', ') || '—'

  const timeStr = record.record_time?.slice(0, 5) ?? ''

  return (
    <Card>
      <Link
        to={`/records/${record.id}`}
        state={linkState}
        className={styles.recordLink}
      >
        <Flex direction="column" gap="1">
          <Text size="2" weight="medium">
            {deedPrefix && (
              <>
                {deedPrefix.emoji} {deedPrefix.name}
                {' — '}
              </>
            )}
            {record.record_date} {timeStr}
          </Text>
          <Text size="2" color="gray">
            {preview}
          </Text>
        </Flex>
      </Link>
    </Card>
  )
}
