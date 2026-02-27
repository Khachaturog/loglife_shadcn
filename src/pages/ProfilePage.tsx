import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Flex, Heading, RadioGroup, Text, TextField, ThemePanel } from '@radix-ui/themes'
import { DatePicker } from '@/components/DatePicker'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { exportAllToCsv, downloadCsv } from '@/lib/export-csv'
import { todayLocalISO } from '@/lib/format-utils'
import styles from './ProfilePage.module.css'

const MIN_PASSWORD_LENGTH = 6

function monthAgo(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Страница профиля.
 * Аккаунт, смена пароля, экспорт в CSV.
 */
export function ProfilePage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // --- Состояние ---
  const [exporting, setExporting] = useState(false)
  const [periodMode, setPeriodMode] = useState<'all' | 'custom'>('all')
  const [startDate, setStartDate] = useState(monthAgo())
  const [endDate, setEndDate] = useState(todayLocalISO())

  // Смена пароля
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordChanging, setPasswordChanging] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  async function handleExportCsv() {
    setExporting(true)
    try {
      const period =
        periodMode === 'custom' && startDate && endDate
          ? { startDate, endDate }
          : undefined
      const csv = await exportAllToCsv(period)
      const name = `log-life-export-${todayLocalISO()}.csv`
      downloadCsv(csv, name)
    } catch (e) {
      console.error(e instanceof Error ? e.message : 'Ошибка экспорта')
    } finally {
      setExporting(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordMessage(null)
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordMessage({ type: 'error', text: `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов` })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Пароли не совпадают' })
      return
    }
    setPasswordChanging(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPasswordMessage({ type: 'error', text: error.message })
        return
      }
      setPasswordMessage({ type: 'success', text: 'Пароль успешно изменён' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (e) {
      setPasswordMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Не удалось изменить пароль',
      })
    } finally {
      setPasswordChanging(false)
    }
  }

  return (
    <Box p="4" className={styles.container}>
      <Heading size="4" mb="4">
        Профиль
      </Heading>

      {/* Аккаунт */}
      <Box mb="4">
        <Heading size="3" mb="2">
          Аккаунт
        </Heading>
        {user?.email && (
          <Text as="p" size="2" mb="2">
            {user.email}
          </Text>
        )}
        <Button variant="soft" color="red" onClick={handleSignOut}>
          Выйти
        </Button>
      </Box>

      {/* Смена пароля */}
      <Box mb="4" py="3" className={styles.sectionDivider}>
        <Heading size="3" mb="2">
          Сменить пароль
        </Heading>
        <form onSubmit={handleChangePassword}>
          <Flex direction="column" gap="3">
            <TextField.Root
              placeholder="Новый пароль (минимум 6 символов)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              disabled={passwordChanging}
            />
            <TextField.Root
              placeholder="Подтвердите пароль"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={passwordChanging}
            />
            {passwordMessage && (
              <Text
                size="2"
                color={passwordMessage.type === 'error' ? 'crimson' : 'green'}
              >
                {passwordMessage.text}
              </Text>
            )}
            <Button type="submit" disabled={passwordChanging}>
              {passwordChanging ? 'Сохранение…' : 'Сменить пароль'}
            </Button>
          </Flex>
        </form>
      </Box>

      {/* Экспорт в CSV */}
      <Box py="3" className={styles.sectionDivider}>
        <Heading size="3" mb="2">
          Экспорт в CSV
        </Heading>
        <Text as="p" size="2" color="gray" mb="2">
          Скачать дела и записи в один CSV‑файл.
        </Text>
        <RadioGroup.Root value={periodMode} onValueChange={(v) => setPeriodMode(v as 'all' | 'custom')}>
          <Flex direction="column" gap="2" mb="3">
            <Text as="label" size="2" className={styles.radioLabel}>
              <RadioGroup.Item value="all" />
              Весь период
            </Text>
            <Text as="label" size="2" className={styles.radioLabel}>
              <RadioGroup.Item value="custom" />
              Свой период
            </Text>
          </Flex>
        </RadioGroup.Root>
        {periodMode === 'custom' && (
          <Flex gap="2" mb="3" wrap="wrap">
            <Flex align="center" gap="2">
              <Text size="2">С</Text>
              <DatePicker value={startDate} onChange={setStartDate} maxDate={endDate} />
            </Flex>
            <Flex align="center" gap="2">
              <Text size="2">По</Text>
              <DatePicker value={endDate} onChange={setEndDate} minDate={startDate} />
            </Flex>
          </Flex>
        )}
        <Button onClick={handleExportCsv} disabled={exporting}>
          {exporting ? 'Экспорт…' : 'Скачать CSV'}
        </Button>
      </Box>

      {/* Внешний вид — настройки сохраняются в cookies браузера */}
      <Box py="3" className={styles.sectionDivider}>
        <Heading size="3" mb="2">
          Внешний вид
        </Heading>
        <Text as="p" size="2" color="gray" mb="2">
          Настройте тему приложения. Выбор сохраняется в cookies браузера.
        </Text>
        <ThemePanel />
      </Box>
    </Box>
  )
}
