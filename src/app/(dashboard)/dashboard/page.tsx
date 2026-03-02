import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getReminders } from '@/lib/supabase/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, FileText, DollarSign, Bell, Calendar, Wrench } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import SendReminderButton from './send-reminder-button'
import type { Database } from '@/types/database'

type ReminderVisit = Database['public']['Tables']['orders']['Row'] & {
  clients?: { name: string; phone: string } | null
}

type ReminderMaintenance = Database['public']['Tables']['clients']['Row']

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  let stats = { clientsCount: 0, ordersCount: 0, totalAmount: 0, ordersByDay: {} }
  let reminders: { visit: ReminderVisit[]; maintenance: ReminderMaintenance[] } = { visit: [], maintenance: [] }

  try {
    stats = await getDashboardStats()
    reminders = await getReminders()
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
        <p className="text-gray-600 mt-1">Обзор вашей работы</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Всего клиентов
            </CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.clientsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Заказы за месяц
            </CardTitle>
            <FileText className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.ordersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Заработок за месяц
            </CardTitle>
            <DollarSign className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalAmount.toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Напоминания */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Напоминания о визитах */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Предстоящие визиты
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reminders.visit.length === 0 ? (
              <p className="text-gray-500 text-sm">Нет предстоящих визитов на завтра</p>
            ) : (
              <ul className="space-y-3">
                {reminders.visit.map((reminder) => (
                  <li
                    key={reminder.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">
                        {reminder.clients?.name || 'Клиент'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {reminder.description}
                      </p>
                      {reminder.visit_date && (
                        <p className="text-xs text-gray-500">
                          {format(parseISO(reminder.visit_date), 'dd MMMM yyyy', { locale: ru })}
                        </p>
                      )}
                    </div>
                    <SendReminderButton
                      type="visit"
                      clientName={reminder.clients?.name || ''}
                      clientPhone={reminder.clients?.phone || ''}
                      date={reminder.visit_date || reminder.date}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Напоминания о профилактике */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-600" />
              Профилактическое обслуживание
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reminders.maintenance.length === 0 ? (
              <p className="text-gray-500 text-sm">Нет клиентов на профилактику в этом месяце</p>
            ) : (
              <ul className="space-y-3">
                {reminders.maintenance.map((reminder) => (
                  <li
                    key={reminder.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">
                        {reminder.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {reminder.equipment_type}
                      </p>
                      {reminder.next_maintenance_date && (
                        <p className="text-xs text-gray-500">
                          {format(parseISO(reminder.next_maintenance_date), 'dd MMMM yyyy', { locale: ru })}
                        </p>
                      )}
                    </div>
                    <SendReminderButton
                      type="maintenance"
                      clientName={reminder.name}
                      clientPhone={reminder.phone}
                      equipmentType={reminder.equipment_type}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* График по дням */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            Активность за последние 7 дней
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.ordersByDay).length === 0 ? (
            <p className="text-gray-500 text-sm">Нет данных о заказах</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {Object.entries(stats.ordersByDay).map(([date, count]) => {
                const numCount = count as number
                const maxCount = Math.max(...Object.values(stats.ordersByDay) as number[])
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-blue-600 rounded-t"
                      style={{ height: `${(numCount / maxCount) * 100}%` }}
                    />
                    <span className="text-xs text-gray-600">
                      {format(parseISO(date), 'dd.MM', { locale: ru })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
