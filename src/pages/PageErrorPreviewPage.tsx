import { Box, Flex } from '@radix-ui/themes'
import { AppBar } from '@/components/AppBar'
import { PageErrorState } from '@/components/PageErrorState'
import layoutStyles from '@/styles/layout.module.css'

/**
 * Предпросмотр общего экрана ошибки (для вёрстки и копирайта).
 * Маршрут: /error-preview
 */
export function PageErrorPreviewPage() {
  return (
    <Flex direction="column" style={{ flex: 1, minHeight: 0, width: '100%' }}>
      <Box className={layoutStyles.pageContainer}>
        <AppBar backHref="/" title="Предпросмотр ошибки" />
      </Box>
      <Box className={layoutStyles.pageContainer} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <PageErrorState
          withPageContainer={false}
          title="Не удалось загрузить данные"
          description="Так выглядит экран при сбое запроса. Ниже — пример технического сообщения."
          code="TypeError: Load failed"
        />
      </Box>
    </Flex>
  )
}
