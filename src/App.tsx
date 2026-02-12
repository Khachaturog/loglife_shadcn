import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Layout } from '@/components/layout/Layout'
import { useAuth } from '@/lib/auth-context'
import { LoadingState } from '@/components/ui/loading-state'

const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const DeedsListPage = lazy(() => import('@/pages/DeedsListPage').then((m) => ({ default: m.DeedsListPage })))
const DeedViewPage = lazy(() => import('@/pages/DeedViewPage').then((m) => ({ default: m.DeedViewPage })))
const DeedFormPage = lazy(() => import('@/pages/DeedFormPage').then((m) => ({ default: m.DeedFormPage })))
const FillFormPage = lazy(() => import('@/pages/FillFormPage').then((m) => ({ default: m.FillFormPage })))
const RecordViewPage = lazy(() => import('@/pages/RecordViewPage').then((m) => ({ default: m.RecordViewPage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const HistoryPage = lazy(() => import('@/pages/HistoryPage').then((m) => ({ default: m.HistoryPage })))

function App() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Загрузка…
      </div>
    )
  }

  if (!user && !isLoginPage) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  return (
    <>
      <Layout>
        <Suspense fallback={<LoadingState />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<DeedsListPage />} />
            <Route path="/deeds/new" element={<DeedFormPage />} />
            <Route path="/deeds/:id" element={<DeedViewPage />} />
            <Route path="/deeds/:id/edit" element={<DeedFormPage />} />
            <Route path="/deeds/:id/fill" element={<FillFormPage />} />
            <Route path="/records/:id" element={<RecordViewPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Suspense>
      </Layout>
      <Toaster richColors position="top-center" />
    </>
  )
}

export default App
