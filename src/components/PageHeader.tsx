import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PageHeaderProps {
  backTo?: string
  title: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader({ backTo, title, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-2 w-full">
      {backTo && (
        <Button variant="ghost" size="icon" asChild>
          <Link to={backTo} aria-label="Назад">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      )}
      <h1 className="text-2xl font-bold tracking-tight flex-1 truncate min-w-0 w-full flex">
        {title}
      </h1>
      {actions}
    </div>
  )
}
