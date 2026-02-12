import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, LogOut } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { exportAllToCsv, downloadCsv } from '@/lib/export-csv'
import { toast } from 'sonner'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [exporting, setExporting] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  async function handleExportCsv() {
    setExporting(true)
    try {
      const csv = await exportAllToCsv()
      const name = `log-life-export-${new Date().toISOString().slice(0, 10)}.csv`
      downloadCsv(csv, name)
      toast.success('Экспорт скачан')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка экспорта')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 w-full">
      <PageHeader title="Профиль" />
      <Card>
        <CardHeader>
          <CardTitle>Аккаунт</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-row items-center gap-4">
          {user?.email && (
            <p className="w-full text-sm text-muted-foreground">{user.email}</p>
          )}
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Экспорт в CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Скачать все дела и записи в один CSV‑файл (дело, дата, время, заметки, ответы по блокам).
          </p>
          <Button
            variant="outline"
            onClick={handleExportCsv}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Экспорт…' : 'Скачать CSV'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
