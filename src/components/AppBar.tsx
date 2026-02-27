import { Link } from 'react-router-dom'
import { Box, Button, Flex, Link as RadixLink, Text } from '@radix-ui/themes'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import styles from './AppBar.module.css'

export interface AppBarProps {
  /** URL для кнопки «Назад» (Link) */
  backHref?: string
  /** Обработчик для кнопки «Назад» (Button с onClick), если нет backHref */
  onBack?: () => void
  /** Заголовок в центре */
  title?: string
  /** Дополнительные действия справа */
  children?: React.ReactNode
}

/**
 * Верхняя панель для внутренних страниц и форм.
 * Показывает кнопку «Назад» и опционально заголовок.
 */
export function AppBar({ backHref, onBack, title, children }: AppBarProps) {
  const showBack = backHref != null || onBack != null

  return (
    <Box className={styles.appBar} asChild>
      <header>
        <Flex align="center" gap="3" className={styles.row}>
          <Flex align="center" style={{ flexShrink: 0 }}>
            {showBack &&
              (backHref != null ? (
                <RadixLink asChild>
                  <Link to={backHref} className={styles.backLink} aria-label="Назад">
                    <ArrowLeftIcon width={18} height={18} />
                    <span>Назад</span>
                  </Link>
                </RadixLink>
              ) : (
                <Button variant="ghost" size="2" onClick={onBack} aria-label="Назад" className={styles.backButton}>
                  <ArrowLeftIcon width={18} height={18} />
                  <span>Назад</span>
                </Button>
              ))}
          </Flex>
          {title && (
            <Text size="2" weight="medium" className={styles.title} truncate>
              {title}
            </Text>
          )}
          {children && (
            <Flex align="center" gap="2" style={{ flexShrink: 0 }} className={styles.actions}>
              {children}
            </Flex>
          )}
        </Flex>
      </header>
    </Box>
  )
}
