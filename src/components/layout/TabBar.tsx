import { NavLink, useLocation } from 'react-router-dom'
import { History, LayoutDashboard, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TabBar() {
  const { pathname } = useLocation()
  const isDeedsActive =
    pathname === '/' ||
    pathname.startsWith('/deeds') ||
    pathname.startsWith('/records')

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden pb-[env(safe-area-inset-bottom)]"
      aria-label="Основная навигация"
    >
      <div className="flex h-14 min-h-[44px] items-center justify-around">
        <NavLink
          to="/"
          className={cn(
            'flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
            isDeedsActive
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-current={isDeedsActive ? 'page' : undefined}
          aria-label="Дела"
        >
          <LayoutDashboard className="h-6 w-6" aria-hidden />
          <span>Дела</span>
        </NavLink>
        <NavLink
          to="/history"
          className={cn(
            'flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
            pathname === '/history'
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-current={pathname === '/history' ? 'page' : undefined}
          aria-label="История"
        >
          <History className="h-6 w-6" aria-hidden />
          <span>История</span>
        </NavLink>
        <NavLink
          to="/profile"
          className={cn(
            'flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
            pathname === '/profile'
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-current={pathname === '/profile' ? 'page' : undefined}
          aria-label="Профиль"
        >
          <User className="h-6 w-6" aria-hidden />
          <span>Профиль</span>
        </NavLink>
      </div>
    </nav>
  )
}
