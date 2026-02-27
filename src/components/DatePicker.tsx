import { useEffect, useRef } from 'react'
import AirDatepicker from 'air-datepicker'
import localeRu from 'air-datepicker/locale/ru'

/** Формат даты для API: YYYY-MM-DD */
const DATE_FORMAT = 'yyyy-MM-dd'

function parseDate(value: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const d = new Date(value + 'T12:00:00')
  return isNaN(d.getTime()) ? null : d
}

/**
 * DatePicker на базе Air Datepicker.
 * value и onChange в формате YYYY-MM-DD.
 */
export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  id,
  disabled,
  placeholder = 'Выберите дату',
}: {
  value: string
  onChange: (value: string) => void
  minDate?: string
  maxDate?: string
  id?: string
  disabled?: boolean
  placeholder?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dpRef = useRef<AirDatepicker | null>(null)

  useEffect(() => {
    if (!inputRef.current || disabled) return

    const parsed = value ? parseDate(value) : null
    const dp = new AirDatepicker(inputRef.current, {
      locale: localeRu,
      dateFormat: DATE_FORMAT,
      selectedDates: parsed ? [parsed] : [],
      startDate: parsed ?? new Date(),
      minDate: minDate ? parseDate(minDate) ?? undefined : undefined,
      maxDate: maxDate ? parseDate(maxDate) ?? undefined : undefined,
      autoClose: true,
      onSelect: ({ formattedDate, date }) => {
        if (date && formattedDate) onChange(formattedDate as string)
      },
    })

    dpRef.current = dp
    return () => {
      dp.destroy()
      dpRef.current = null
    }
  }, [disabled])

  // Синхронизация при изменении value извне (controlled)
  useEffect(() => {
    if (!dpRef.current || disabled) return
    const parsed = value ? parseDate(value) : null
    dpRef.current.update({
      selectedDates: parsed ? [parsed] : [],
      minDate: minDate ? parseDate(minDate) ?? undefined : undefined,
      maxDate: maxDate ? parseDate(maxDate) ?? undefined : undefined,
    })
  }, [value, minDate, maxDate, disabled])

  return (
    <input
      ref={inputRef}
      type="text"
      id={id}
      readOnly
      disabled={disabled}
      placeholder={placeholder}
      defaultValue={value}
      className="date-picker-input"
      style={{
        width: '100%',
        padding: 'var(--space-2)',
        borderRadius: 'var(--radius-2)',
        border: '1px solid var(--gray-a7)',
        background: 'var(--color-background)',
        color: 'var(--gray-12)',
        fontSize: 'var(--font-size-2)',
        fontFamily: 'inherit',
        cursor: 'pointer',
      }}
    />
  )
}
