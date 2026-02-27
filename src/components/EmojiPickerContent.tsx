import data from '@emoji-mart/data'
import i18n from '@emoji-mart/data/i18n/ru.json'
import Picker from '@emoji-mart/react'

type EmojiPickerContentProps = {
  onEmojiSelect: (emoji: { native: string }) => void
}

/**
 * Контент Popover с emoji-mart Picker.
 * Вынесен в отдельный модуль для lazy-загрузки — подгружается только при открытии пикера.
 */
export function EmojiPickerContent({ onEmojiSelect }: EmojiPickerContentProps) {
  return (
    <Picker
      data={data}
      i18n={i18n}
      locale="ru"
      theme="auto"
      onEmojiSelect={onEmojiSelect}
    />
  )
}
