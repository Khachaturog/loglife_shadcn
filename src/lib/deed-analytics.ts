import { todayLocalISO } from '@/lib/format-utils'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Уникальные даты по записям, отсортированные по возрастанию. */
export function uniqueDatesSorted(
  records: { record_date: string }[]
): string[] {
  const set = new Set(records.map((r) => r.record_date))
  return Array.from(set).sort()
}

/** Количество дней между двумя датами YYYY-MM-DD (в UTC). */
function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b + 'Z') - Date.parse(a + 'Z')) / MS_PER_DAY)
}

/** Текущий стрик: сколько дней подряд до сегодня есть хотя бы одна запись. Если сегодня записей нет — 0. */
export function currentStreak(records: { record_date: string }[]): number {
  const datesSet = new Set(records.map((r) => r.record_date))
  const today = todayLocalISO()
  if (!datesSet.has(today)) return 0
  let count = 0
  let d = today
  while (datesSet.has(d)) {
    count++
    const prev = new Date(Date.parse(d + 'Z') - MS_PER_DAY)
    const y = prev.getUTCFullYear()
    const m = String(prev.getUTCMonth() + 1).padStart(2, '0')
    const day = String(prev.getUTCDate()).padStart(2, '0')
    d = `${y}-${m}-${day}`
  }
  return count
}

/** Максимальный стрик: длина самой длинной серии подряд идущих дней с записями. */
export function maxStreak(records: { record_date: string }[]): number {
  const dates = uniqueDatesSorted(records)
  if (dates.length === 0) return 0
  let max = 1
  let current = 1
  for (let i = 1; i < dates.length; i++) {
    if (dayDiff(dates[i - 1], dates[i]) === 1) {
      current++
      max = Math.max(max, current)
    } else {
      current = 1
    }
  }
  return max
}

/** День недели по YYYY-MM-DD в UTC: 0 = вс, 6 = сб. */
function getUTCDayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'Z').getUTCDay()
}

/** Число записей в рабочие дни (пн–пт) и в выходные (сб–вс). */
export function workdayWeekendCounts(records: { record_date: string }[]): {
  workday: number
  weekend: number
} {
  let workday = 0
  let weekend = 0
  for (const r of records) {
    const day = getUTCDayOfWeek(r.record_date)
    if (day >= 1 && day <= 5) workday++
    else weekend++
  }
  return { workday, weekend }
}

