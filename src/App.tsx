import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Box, Flex, Text } from '@radix-ui/themes'
import { useAuth } from '@/lib/auth-context'
import { TabBar, useTabBarVisible } from '@/components/TabBar'
import styles from './App.module.css'

const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const DeedsListPage = lazy(() => import('@/pages/DeedsListPage').then((m) => ({ default: m.DeedsListPage })))
const DeedViewPage = lazy(() => import('@/pages/DeedViewPage').then((m) => ({ default: m.DeedViewPage })))
const DeedFormPage = lazy(() => import('@/pages/DeedFormPage').then((m) => ({ default: m.DeedFormPage })))
const FillFormPage = lazy(() => import('@/pages/FillFormPage').then((m) => ({ default: m.FillFormPage })))
const RecordViewPage = lazy(() => import('@/pages/RecordViewPage').then((m) => ({ default: m.RecordViewPage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const HistoryPage = lazy(() => import('@/pages/HistoryPage').then((m) => ({ default: m.HistoryPage })))
const WidgetsPage = lazy(() => import('@/pages/WidgetsPage').then((m) => ({ default: m.WidgetsPage })))
const ClickerPage = lazy(() => import('@/pages/ClickerPage').then((m) => ({ default: m.ClickerPage })))

function App() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  if (loading) {
    return (
      <Box p="4" className={styles.loading}>
        <Text>Загрузка…</Text>
      </Box>
    )
  }

  if (!user && !isLoginPage) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  const showTabBar = useTabBarVisible()

  return (
    <Flex direction="column" className={styles.app}>
      <Box className={`${styles.main} ${showTabBar ? styles.mainWithTabBar : ''}`}>
        <Suspense
          fallback={
            <Box p="4" className={styles.suspenseFallback}>
              <Text>Загрузка…</Text>
            </Box>
          }
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<DeedsListPage />} />
            <Route path="/deeds/new" element={<DeedFormPage />} />
            <Route path="/deeds/:id" element={<DeedViewPage />} />
            <Route path="/deeds/:id/edit" element={<DeedFormPage />} />
            <Route path="/deeds/:id/fill" element={<FillFormPage />} />
            <Route path="/records/:id" element={<RecordViewPage />} />
            <Route path="/widgets" element={<WidgetsPage />} />
            <Route path="/widgets/clicker" element={<ClickerPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Suspense>
      </Box>

      <TabBar />
    </Flex>
  )
}

export default App
