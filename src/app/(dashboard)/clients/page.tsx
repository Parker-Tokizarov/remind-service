'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Plus, Edit, Trash2, Phone, MapPin, Wrench, Calendar, Search, Download, Filter } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'

const clientSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  phone: z.string().min(5, 'Введите корректный номер телефона'),
  address: z.string().optional(),
  equipment_type: z.string().min(1, 'Выберите тип техники'),
  last_visit_date: z.string().optional(),
  next_maintenance_date: z.string().optional(),
  notes: z.string().optional(),
})

type ClientForm = z.infer<typeof clientSchema>

const equipmentTypes = [
  { value: 'washing_machine', label: 'Стиральная машина' },
  { value: 'refrigerator', label: 'Холодильник' },
  { value: 'air_conditioner', label: 'Кондиционер' },
  { value: 'boiler', label: 'Котел' },
  { value: 'dishwasher', label: 'Посудомоечная машина' },
  { value: 'oven', label: 'Духовой шкаф' },
  { value: 'other', label: 'Другое' },
]

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [filteredClients, setFilteredClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('')
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
  })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current user:', user?.id)
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Loaded clients:', data)
      setClients(data || [])
      setFilteredClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  // Поиск и фильтрация
  useEffect(() => {
    let result = [...clients]

    // Поиск по имени и телефону
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(client =>
        client.name.toLowerCase().includes(query) ||
        client.phone.includes(query) ||
        (client.address && client.address.toLowerCase().includes(query))
      )
    }

    // Фильтр по типу техники
    if (equipmentFilter) {
      result = result.filter(client => client.equipment_type === equipmentFilter)
    }

    setFilteredClients(result)
  }, [searchQuery, equipmentFilter, clients])

  // Экспорт в CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Имя', 'Телефон', 'Адрес', 'Тип техники', 'Последнее обращение', 'Примечание']
    const rows = filteredClients.map(client => [
      client.id,
      `"${client.name}"`,
      `"${client.phone}"`,
      `"${client.address || ''}"`,
      client.equipment_type,
      client.last_visit_date,
      `"${client.notes || ''}"`
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `clients_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleOpenModal = (client?: any) => {
    if (client) {
      setEditingClient(client)
      reset({
        name: client.name,
        phone: client.phone,
        address: client.address || '',
        equipment_type: client.equipment_type,
        last_visit_date: client.last_visit_date?.split('T')[0] || '',
        next_maintenance_date: client.next_maintenance_date?.split('T')[0] || '',
        notes: client.notes || '',
      })
    } else {
      setEditingClient(null)
      reset({
        name: '',
        phone: '',
        address: '',
        equipment_type: 'washing_machine',
        last_visit_date: new Date().toISOString().split('T')[0],
        next_maintenance_date: '',
        notes: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingClient(null)
    reset()
  }

  const handleSubmitClient = async (data: ClientForm) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Auth error:', authError)
        throw new Error('Пользователь не авторизован')
      }

      console.log('Saving client with user_id:', user.id)
      console.log('Client data:', data)

      if (editingClient) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from('clients')
          .update(data)
          .eq('id', editingClient.id)
        
        if (updateError) {
          console.error('Update error:', updateError)
          throw updateError
        }
      } else {
        const insertData = {
          ...data,
          user_id: user.id,
          last_visit_date: data.last_visit_date || new Date().toISOString().split('T')[0],
        }
        
        console.log('Insert data:', insertData)
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any)
          .from('clients')
          .insert(insertData)
        
        if (insertError) {
          console.error('Insert error:', insertError)
          throw insertError
        }
      }

      await loadClients()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving client:', error)
      alert('Ошибка при сохранении клиента: ' + (error as Error).message)
    }
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого клиента?')) return

    try {
      await supabase.from('clients').delete().eq('id', id)
      await loadClients()
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Ошибка при удалении клиента')
    }
  }

  const getEquipmentLabel = (value: string) => {
    return equipmentTypes.find(t => t.value === value)?.label || value
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Клиенты</h1>
          <p className="text-gray-600 mt-1">База ваших клиентов</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Экспорт CSV
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить клиента
          </Button>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Поиск по имени, телефону или адресу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-64">
              <Select
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
              >
                <option value="">Все типы техники</option>
                {equipmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {(searchQuery || equipmentFilter) && (
            <div className="mt-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Найдено: {filteredClients.length} из {clients.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setEquipmentFilter('')
                }}
                className="ml-auto"
              >
                Сбросить
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            {clients.length === 0
              ? 'У вас пока нет клиентов. Добавьте первого клиента!'
              : 'Ничего не найдено по заданным критериям поиска.'
            }
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{client.name}</span>
                  <div className="flex gap-2">
                    <Link href={`/clients/${client.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{client.phone}</span>
                </div>
                {client.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{client.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Wrench className="w-4 h-4" />
                  <span className="text-sm">{getEquipmentLabel(client.equipment_type)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    Последнее обращение:{' '}
                    {format(parseISO(client.last_visit_date), 'dd.MM.yyyy', { locale: ru })}
                  </span>
                </div>
                {client.next_maintenance_date && (
                  <div className="text-sm text-blue-600">
                    След. обслуживание:{' '}
                    {format(parseISO(client.next_maintenance_date), 'dd.MM.yyyy', { locale: ru })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingClient ? 'Редактировать клиента' : 'Добавить клиента'}
        size="md"
      >
        <form onSubmit={handleSubmit(handleSubmitClient)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя *
            </label>
            <Input {...register('name')} placeholder="Иван Иванов" />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон *
            </label>
            <Input {...register('phone')} placeholder="+7 (999) 000-00-00" />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Адрес
            </label>
            <Input {...register('address')} placeholder="г. Москва, ул. Ленина, д. 1" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип техники *
            </label>
            <Select {...register('equipment_type')}>
              {equipmentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
            {errors.equipment_type && (
              <p className="mt-1 text-sm text-red-600">{errors.equipment_type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата последнего обращения
            </label>
            <Input type="date" {...register('last_visit_date')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата следующего обслуживания
            </label>
            <Input type="date" {...register('next_maintenance_date')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Примечание
            </label>
            <Textarea {...register('notes')} rows={3} placeholder="Заметки о ремонте" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" className="flex-1">
              {editingClient ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
