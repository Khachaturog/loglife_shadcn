import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Layout } from '@/components/layout/Layout'
import { useAuth } from '@/lib/auth-context'
import { LoginPage } from '@/pages/LoginPage'
import { DeedsListPage } from '@/pages/DeedsListPage'
import { DeedViewPage } from '@/pages/DeedViewPage'
import { DeedFormPage } from '@/pages/DeedFormPage'
import { FillFormPage } from '@/pages/FillFormPage'
import { RecordViewPage } from '@/pages/RecordViewPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { HistoryPage } from '@/pages/HistoryPage'

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
      </Layout>
      <Toaster richColors position="top-center" />
    </>
  )
}

export default App
