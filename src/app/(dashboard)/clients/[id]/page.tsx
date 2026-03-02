'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { ArrowLeft, Plus, Edit, Trash2, Phone, MapPin, Wrench, Calendar, DollarSign } from 'lucide-react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'
import type { Database } from '@/types/database'

const orderSchema = z.object({
  date: z.string(),
  description: z.string().min(5, 'Описание должно содержать минимум 5 символов'),
  amount: z.number().default(0),
  visit_date: z.string().optional(),
})

type OrderForm = z.infer<typeof orderSchema>

type OrderFormData = {
  date: string
  description: string
  amount: string
  visit_date?: string
}

const equipmentTypes: Record<string, string> = {
  washing_machine: 'Стиральная машина',
  refrigerator: 'Холодильник',
  air_conditioner: 'Кондиционер',
  boiler: 'Котел',
  dishwasher: 'Посудомоечная машина',
  oven: 'Духовой шкаф',
  other: 'Другое',
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<any | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any | null>(null)
  const supabase = createClient() as ReturnType<typeof createClient> & {
    from: <T extends keyof Database['public']['Tables']>(table: T) => any
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrderFormData>()

  useEffect(() => {
    loadClientData()
  }, [])

  const loadClientData = async () => {
    try {
      const clientId = params.id as string
      
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError) throw clientError
      setClient(clientData)

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false })

      if (ordersError) throw ordersError
      setOrders(ordersData || [])
    } catch (error) {
      console.error('Error loading client data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenOrderModal = (order?: any) => {
    if (order) {
      setEditingOrder(order)
      reset({
        date: order.date?.split('T')[0] || '',
        description: order.description,
        amount: order.amount?.toString() || '0',
        visit_date: order.visit_date?.split('T')[0] || '',
      })
    } else {
      setEditingOrder(null)
      reset({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '0',
        visit_date: '',
      })
    }
    setIsOrderModalOpen(true)
  }

  const handleSubmitOrder = async (data: OrderForm) => {
    try {
      const clientId = params.id as string
      
      if (editingOrder) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('orders')
          .update({
            date: data.date,
            description: data.description,
            amount: data.amount,
            visit_date: data.visit_date || null,
          })
          .eq('id', editingOrder.id)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('orders')
          .insert({
            date: data.date,
            description: data.description,
            amount: data.amount,
            visit_date: data.visit_date || null,
            client_id: clientId,
          })
      }

      await loadClientData()
      setIsOrderModalOpen(false)
      reset()
    } catch (error) {
      console.error('Error saving order:', error)
      alert('Ошибка при сохранении заказа')
    }
  }

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return

    try {
      await supabase.from('orders').delete().eq('id', id)
      await loadClientData()
    } catch (error) {
      console.error('Error deleting order:', error)
      alert('Ошибка при удалении заказа')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Клиент не найден</p>
        <Link href="/clients">
          <Button className="mt-4">Вернуться к клиентам</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-gray-600">{equipmentTypes[client.equipment_type] || client.equipment_type}</p>
        </div>
      </div>

      {/* Информация о клиенте */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о клиенте</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{client.phone}</span>
            </div>
            {client.address && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{client.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                Последнее обращение:{' '}
                {format(parseISO(client.last_visit_date), 'dd MMMM yyyy', { locale: ru })}
              </span>
            </div>
            {client.next_maintenance_date && (
              <div className="flex items-center gap-2 text-blue-600">
                <Wrench className="w-4 h-4" />
                <span>
                  След. обслуживание:{' '}
                  {format(parseISO(client.next_maintenance_date), 'dd MMMM yyyy', { locale: ru })}
                </span>
              </div>
            )}
          </div>
          {client.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">{client.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* История заказов */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>История заказов</CardTitle>
          <Button size="sm" onClick={() => handleOpenOrderModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить заказ
          </Button>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Нет истории заказов</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-gray-900">
                        {format(parseISO(order.date), 'dd.MM.yyyy', { locale: ru })}
                      </span>
                      {order.visit_date && (
                        <span className="text-sm text-blue-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Визит: {format(parseISO(order.visit_date), 'dd.MM.yyyy', { locale: ru })}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">{order.description}</p>
                    <div className="flex items-center gap-1 text-green-600 font-medium">
                      <DollarSign className="w-4 h-4" />
                      {order.amount} ₽
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenOrderModal(order)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Модальное окно заказа */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title={editingOrder ? 'Редактировать заказ' : 'Добавить заказ'}
        size="sm"
      >
        <form onSubmit={handleSubmit((data) => {
          const validatedData = orderSchema.parse({
            ...data,
            amount: parseFloat(data.amount as any) || 0,
          })
          handleSubmitOrder(validatedData)
        })} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата
            </label>
            <Input type="date" {...register('date')} />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата визита
            </label>
            <Input type="date" {...register('visit_date')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание работ *
            </label>
            <Textarea {...register('description')} rows={3} placeholder="Что было сделано" />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Стоимость (₽)
            </label>
            <Input type="number" {...register('amount')} placeholder="0" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOrderModalOpen(false)}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button type="submit" className="flex-1">
              {editingOrder ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
