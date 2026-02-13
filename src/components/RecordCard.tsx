import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { previewAnswer } from '@/lib/format-utils'
import type { ValueJson } from '@/types/database'

type RecordWithAnswers = {
  id: string
  record_date: string
  record_time?: string | null
  record_answers?: { value_json: unknown }[]
} & (
  | { deed?: { emoji: string; name: string } }
  | Record<string, never>
)

interface RecordCardProps {
  record: RecordWithAnswers
  /** Для истории: показывать время + название дела */
  variant?: 'deed' | 'history'
}

export function RecordCard({ record, variant = 'deed' }: RecordCardProps) {
  const preview = record.record_answers?.length
    ? previewAnswer(record.record_answers[0].value_json as ValueJson, variant === 'history' ? 25 : 20)
    : '—'

  if (variant === 'history' && 'deed' in record && record.deed) {
    return (
      <Link to={`/records/${record.id}`}>
        <Card className="w-full hover:bg-accent/50 transition-colors">
          <CardContent className="w-full py-3 px-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="text-sm font-medium shrink-0">
              {(record.record_time ?? '').toString().slice(0, 5)}
            </span>
            <span className="text-sm truncate w-fit">
              {record.deed.emoji} {record.deed.name}
            </span>
            <span className="text-muted-foreground text-sm truncate sm:ml-auto">
              {preview}
            </span>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link to={`/records/${record.id}`}>
      <Card className="hover:bg-accent/50 transition-colors">
        <CardContent className="py-3 px-4 flex items-center justify-between gap-2">
          <span className="text-sm font-medium">
            {record.record_date} {record.record_time}
          </span>
          <span className="text-muted-foreground text-sm truncate max-w-[50%]">
            {preview}
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}
