import { cn } from '@/lib/utils'

interface ErrorStateProps {
  message: string
  className?: string
}

export function ErrorState({ message, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive',
        className
      )}
    >
      {message}
    </div>
  )
}
