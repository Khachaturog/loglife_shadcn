import type { ValueJson } from '@/types/database'

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Сегодня'
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Краткий превью ответа для списков (число, текст до 20–25 символов, галочки и т.д.) */
export function previewAnswer(value: ValueJson | null | undefined, maxTextLen = 20): string {
  if (!value) return '—'
  if ('number' in value && value.number !== undefined) return String(value.number)
  if ('text' in value && value.text) return value.text.length > maxTextLen ? value.text.slice(0, maxTextLen) + '…' : value.text
  if ('optionId' in value) return '✓'
  if ('optionIds' in value && Array.isArray(value.optionIds)) return value.optionIds.length ? `✓ ${value.optionIds.length}` : '—'
  if ('scaleValue' in value) return String(value.scaleValue)
  if ('yesNo' in value) return value.yesNo ? 'Да' : 'Нет'
  return '—'
}
