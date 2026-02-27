import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, ClockIcon, HomeIcon, PersonIcon, ViewGridIcon } from '@radix-ui/react-icons'
import styles from './TabBar.module.css'
import { Button } from '@radix-ui/themes'

/** Панель скрыта на: виджет кликер, форма создания/редактирования дела, форма создания записи, просмотр/редактирование записи */
export function useTabBarVisible(): boolean {
  const path = useLocation().pathname
  if (path.match(/\/deeds\/[^/]+\/(edit|fill)/)) return false
  if (path === '/widgets/clicker') return false
  if (/^\/records\/[^/]+$/.test(path)) return false
  return true
}

/** Кнопка «Назад» показывается на странице просмотра дела и записи */
function useShowBackButton(): boolean {
  const path = useLocation().pathname
  return /^\/deeds\/[^/]+$/.test(path) || /^\/records\/[^/]+$/.test(path)
}

/** Плавающая нижняя панель: 4 раздела (механика iOS 26, стиль Radix) */
export function TabBar() {
  const visible = useTabBarVisible()
  const showBackButton = useShowBackButton()
  const path = useLocation().pathname
  const navigate = useNavigate()
  const isRecordPage = /^\/records\/[^/]+$/.test(path)

  if (!visible) return null

  return (
    <div className={styles.barWrapper}>
      {showBackButton &&
        (isRecordPage ? (
          <Button
            variant="surface"
            color="gray"
            radius="full"
            size="3"
            className={styles.backButton}
            aria-label="Назад"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon width={20} height={20} />
          </Button>
        ) : (
          <Button variant="surface" color="gray" radius="full" size="3" asChild className={styles.backButton} aria-label="Назад">
            <Link to="/">
              <ArrowLeftIcon width={20} height={20} />
            </Link>
          </Button>
        ))}
      <nav className={styles.tabBar}>
      <NavLink to="/" className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}>
        <HomeIcon width={20} height={20} />
        <span>Главная</span>
      </NavLink>
      <NavLink to="/widgets" end={false} className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}>
        <ViewGridIcon width={20} height={20} />
        <span>Виджеты</span>
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}>
        <ClockIcon width={20} height={20} />
        <span>История</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}>
        <PersonIcon width={20} height={20} />
        <span>Профиль</span>
      </NavLink>
    </nav>
    </div>
  )
}
