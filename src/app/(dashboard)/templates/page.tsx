'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Plus, Edit, Trash2, FileText, MessageSquare } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const templateSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
  type: z.enum(['visit', 'maintenance']),
  content: z.string().min(10, 'Шаблон должен содержать минимум 10 символов'),
})

type TemplateForm = z.infer<typeof templateSchema>

const templateTypes = [
  { value: 'visit', label: 'Напоминание о визите' },
  { value: 'maintenance', label: 'Предложение профилактики' },
]

const variablesInfo = {
  visit: [
    { name: '{clientName}', description: 'Имя клиента' },
    { name: '{date}', description: 'Дата визита' },
    { name: '{time}', description: 'Время визита' },
  ],
  maintenance: [
    { name: '{clientName}', description: 'Имя клиента' },
    { name: '{equipmentType}', description: 'Тип техники' },
  ],
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
  })

  const selectedType = watch('type')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (template?: any) => {
    if (template) {
      setEditingTemplate(template)
      reset({
        name: template.name,
        type: template.type,
        content: template.content,
      })
    } else {
      setEditingTemplate(null)
      reset({
        name: '',
        type: 'visit',
        content: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTemplate(null)
    reset()
  }

  const handleSubmitTemplate = async (data: TemplateForm) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Пользователь не авторизован')

      if (editingTemplate) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('templates')
          .update(data)
          .eq('id', editingTemplate.id)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('templates')
          .insert({ ...data, user_id: user.id })
      }

      await loadTemplates()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Ошибка при сохранении шаблона')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот шаблон?')) return

    try {
      await supabase.from('templates').delete().eq('id', id)
      await loadTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Ошибка при удалении шаблона')
    }
  }

  const getTypeLabel = (type: string) => {
    return templateTypes.find(t => t.value === type)?.label || type
  }

  const getTypeColor = (type: string) => {
    return type === 'visit' ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50'
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
          <h1 className="text-2xl font-bold text-gray-900">Шаблоны сообщений</h1>
          <p className="text-gray-600 mt-1">Управление шаблонами напоминаний</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить шаблон
        </Button>
      </div>

      {/* Информация о переменных */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            Переменные в шаблонах
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Для напоминания о визите:</h4>
              <ul className="space-y-1">
                {variablesInfo.visit.map((v) => (
                  <li key={v.name} className="text-sm text-gray-600">
                    <code className="bg-gray-100 px-2 py-0.5 rounded">{v.name}</code> — {v.description}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Для предложения профилактики:</h4>
              <ul className="space-y-1">
                {variablesInfo.maintenance.map((v) => (
                  <li key={v.name} className="text-sm text-gray-600">
                    <code className="bg-gray-100 px-2 py-0.5 rounded">{v.name}</code> — {v.description}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список шаблонов */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            У вас пока нет шаблонов. Создайте первый шаблон!
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{template.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(template.type)}`}>
                    {getTypeLabel(template.type)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{template.content}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenModal(template)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Редактировать
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Модальное окно */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTemplate ? 'Редактировать шаблон' : 'Новый шаблон'}
        size="md"
      >
        <form onSubmit={handleSubmit(handleSubmitTemplate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <Input {...register('name')} placeholder="Например: Напоминание о визите" />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип *
            </label>
            <Select {...register('type')}>
              {templateTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Текст шаблона *
            </label>
            <Textarea
              {...register('content')}
              rows={6}
              placeholder="Здравствуйте, {clientName}! Напоминаем..."
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          {selectedType && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">Доступные переменные:</p>
              <div className="flex flex-wrap gap-2">
                {variablesInfo[selectedType as keyof typeof variablesInfo].map((v) => (
                  <span
                    key={v.name}
                    className="text-xs bg-white px-2 py-1 rounded border border-blue-200 text-blue-700"
                  >
                    {v.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button type="submit" className="flex-1">
              {editingTemplate ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
