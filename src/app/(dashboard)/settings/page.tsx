'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LogOut, Save, Send, User, Phone, Moon, Sun } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'

const settingsSchema = z.object({
  full_name: z.string().optional(),
  phone: z.string().optional(),
  telegram_token: z.string().optional(),
  telegram_chat_id: z.string().optional(),
})

type SettingsForm = z.infer<typeof settingsSchema>

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
  })

  useEffect(() => {
    // Загрузка сохранённой темы
    const savedTheme = localStorage.getItem('theme')
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDarkMode(isDark)
    applyTheme(isDark)
    
    loadProfile()
  }, [])

  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const toggleTheme = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    applyTheme(newMode)
  }

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data as any)
      reset({
        full_name: (data as any)?.full_name || '',
        phone: (data as any)?.phone || '',
        telegram_token: (data as any)?.telegram_token || '',
        telegram_chat_id: (data as any)?.telegram_chat_id || '',
      })
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (data: SettingsForm) => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Пользователь не авторизован')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('profiles')
        .update(data)
        .eq('id', user.id)

      if (error) throw error

      alert('Настройки сохранены!')
      loadProfile()
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Ошибка при сохранении настроек')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    if (!confirm('Вы уверены, что хотите выйти?')) return

    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleTestTelegram = async () => {
    const values = watch()
    const token = values.telegram_token
    const chatId = values.telegram_chat_id

    if (!token || !chatId) {
      alert('Введите токен бота и Chat ID')
      return
    }

    try {
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '🔔 RemindService: Тестовое сообщение. Интеграция работает!',
          test: true,
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert('Тестовое сообщение отправлено! Проверьте Telegram.')
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      alert(`Ошибка: ${error.message || 'Не удалось отправить сообщение'}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Настройки</h1>
          <p className="text-gray-600 mt-1 dark:text-gray-400">Управление профилем и интеграциями</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={toggleTheme}>
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 mr-2" />
                Светлая
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 mr-2" />
                Тёмная
              </>
            )}
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>

      {/* Профиль */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Профиль
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ФИО
                </label>
                <Input
                  {...register('full_name')}
                  placeholder="Иван Иванов"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Телефон
                </label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <Input
                    {...register('phone')}
                    placeholder="+7 (999) 000-00-00"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Telegram интеграция */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Интеграция с Telegram
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Как настроить:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Создайте бота через @BotFather в Telegram</li>
              <li>Скопируйте токен бота</li>
              <li>Напишите своему боту любое сообщение</li>
              <li>Узнайте свой Chat ID через бота @userinfobot</li>
              <li>Вставьте токен и Chat ID в поля ниже</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Токен Telegram бота
              </label>
              <Input
                {...register('telegram_token')}
                type="password"
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              />
              <p className="text-xs text-gray-500 mt-1">
                Токен хранится в зашифрованном виде
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ваш Chat ID
              </label>
              <Input
                {...register('telegram_chat_id')}
                placeholder="123456789"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleTestTelegram}
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                Тест
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* О приложении */}
      <Card>
        <CardHeader>
          <CardTitle>О приложении</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>RemindService</strong> — сервис напоминаний для мастеров по ремонту бытовой техники.</p>
            <p>Версия: 1.0.0 (MVP)</p>
            <p>© 2026 RemindService</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
