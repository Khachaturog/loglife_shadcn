import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { DeedWithBlocks } from '@/types/database'
import type { RecordRow, RecordAnswerRow } from '@/types/database'
import { getDeedDisplayNumbers } from '@/lib/deed-utils'

interface DeedCardProps {
  deed: DeedWithBlocks
  records: (RecordRow & { record_answers?: RecordAnswerRow[] })[]
}

export function DeedCard({ deed, records }: DeedCardProps) {
  const { today, total } = getDeedDisplayNumbers(deed.blocks ?? [], records)

  return (
    <Card className="transition-colors hover:bg-accent/50">
      <Link to={`/deeds/${deed.id}`} className="block">
        <CardContent className="flex flex-row items-center justify-center gap-3 pt-3 pb-3">
          <span className="text-2xl shrink-0 h-full" aria-hidden>
            {deed.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{deed.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {today} сегодня · {total} всего
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link to={`/deeds/${deed.id}/fill`} onClick={(e) => e.stopPropagation()}>
              Добавить запись
            </Link>
          </Button>
        </CardContent>
      </Link>
    </Card>
  )
}
