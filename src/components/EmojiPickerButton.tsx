import { lazy, Suspense, useState } from 'react'
import { Button, Flex, Popover, Spinner } from '@radix-ui/themes'
import styles from './EmojiPickerButton.module.css'

const EmojiPickerContent = lazy(() =>
  import('./EmojiPickerContent').then((m) => ({ default: m.EmojiPickerContent })),
)

type EmojiPickerButtonProps = {
  value: string
  onChange: (emoji: string) => void
}

const DEFAULT_EMOJI = '📋'

/**
 * Кнопка с текущим эмодзи, по клику открывает Popover с emoji-mart Picker.
 * Picker загружается лениво — только при открытии Popover.
 */
export function EmojiPickerButton({ value, onChange }: EmojiPickerButtonProps) {
  const [open, setOpen] = useState(false)
  const displayEmoji = value?.trim() || DEFAULT_EMOJI

  function handleEmojiSelect(emoji: { native: string }) {
    onChange(emoji.native)
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <Button
          type="button"
          variant="surface"
          color='gray'
          highContrast={true}
          size="3"
          aria-label="Выбрать эмодзи"
          className={styles.emojiPickerButton}
        >
          {displayEmoji}
        </Button>
      </Popover.Trigger>
      <Popover.Content 
      width="auto" 
      className={styles.emojiPickerContent}
      >
        <Flex>
          {open && (
            <Suspense fallback={<Spinner size="2" />}>
              <EmojiPickerContent onEmojiSelect={handleEmojiSelect} />
            </Suspense>
          )}
        </Flex>
      </Popover.Content>
    </Popover.Root>
  )
}
