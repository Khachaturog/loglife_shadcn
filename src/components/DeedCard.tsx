import { Link } from 'react-router-dom'
import { Box, Card, Flex, IconButton, Text } from '@radix-ui/themes'
import { PlusIcon } from '@radix-ui/react-icons'
import type { DeedWithBlocks } from '@/types/database'
import type { RecordRow, RecordAnswerRow } from '@/types/database'
import { getDeedDisplayNumbers } from '@/lib/deed-utils'
import styles from './DeedCard.module.css'

type DeedCardProps = {
  deed: DeedWithBlocks
  records: (RecordRow & { record_answers?: RecordAnswerRow[] })[]
}

/**
 * Карточка дела в списке.
 * Левая часть (название + статистика) — ссылка на просмотр дела.
 * Кнопка + — ссылка на форму добавления записи.
 */
export function DeedCard({ deed, records }: DeedCardProps) {
  // today/total зависят от типа блоков: см. getDeedDisplayNumbers в deed-utils
  const { today, total } = getDeedDisplayNumbers(deed.blocks ?? [], records)

  return (
    <Card>
      <Flex align="center" justify="between" gap="3">
        {/* Кликабельная область: переход на /deeds/:id */}
        <Link
          to={`/deeds/${deed.id}`}
          className={styles.deedLink}
        >
          <Box>
            <Text weight="medium">
              {deed.emoji} {deed.name}
              {deed.category && (
                <Text as="span" color="gray">
                  {' '}
                  ({deed.category})
                </Text>
              )}
            </Text>
            <Text as="p" size="2" color="gray">
              — {today} сегодня, {total} всего
            </Text>
          </Box>
        </Link>
        {/* Кнопка добавления записи: переход на /deeds/:id/fill */}
        <IconButton
          size="2"
          variant="soft"
          asChild
          title="Добавить запись"
          aria-label="Добавить запись"
        >
          <Link to={`/deeds/${deed.id}/fill`}>
            <PlusIcon />
          </Link>
        </IconButton>
      </Flex>
    </Card>
  )
}
