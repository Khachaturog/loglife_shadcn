import { Link, useLocation } from 'react-router-dom'
import { History, LayoutDashboard, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TabBar } from '@/components/layout/TabBar'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4 gap-4">
          <Link
            to="/"
            className={cn(
              'flex items-center gap-2 font-semibold',
              isHome ? 'text-primary' : 'text-foreground hover:text-primary'
            )}
          >
            <LayoutDashboard className="h-6 w-6" aria-hidden />
            <span>Log Life</span>
          </Link>
          <nav className="flex-1 flex justify-end gap-1">
            <Link
              to="/history"
              className={cn(
                'inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                location.pathname === '/history' && 'text-primary'
              )}
              aria-label="История"
            >
              <History className="h-5 w-5" />
            </Link>
            <Link
              to="/profile"
              className={cn(
                'inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                location.pathname === '/profile' && 'text-primary'
              )}
              aria-label="Профиль"
            >
              <User className="h-5 w-5" />
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container px-4 py-6 pb-20 max-w-2xl mx-auto w-full md:pb-6">
        {children}
      </main>
      <TabBar />
    </div>
  )
}
