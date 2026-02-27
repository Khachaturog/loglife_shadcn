import { Link } from 'react-router-dom'
import { Box, Flex, Heading, Link as RadixLink, Text } from '@radix-ui/themes'
import styles from './WidgetsPage.module.css'

/**
 * Страница виджетов.
 * Список доступных виджетов (кликер и др.) с переходами.
 */
export function WidgetsPage() {
  return (
    <Box p="4" className={styles.container}>
      <Heading size="4" mb="4">
        Виджеты
      </Heading>
      <Flex direction="column" gap="3">
        <RadixLink asChild>
          <Link
            to="/widgets/clicker"
            className={styles.widgetLink}
          >
            <Text weight="medium" size="3">
              Кликер
            </Text>
            <Text as="p" size="2" color="gray" mt="1">
              Счётчик нажатий с сохранением в дело
            </Text>
          </Link>
        </RadixLink>
      </Flex>
    </Box>
  )
}
