'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Copy } from 'lucide-react'
import { Modal } from '@/components/ui/modal'

interface SendReminderButtonProps {
  type: 'visit' | 'maintenance'
  clientName: string
  clientPhone: string
  date?: string
  time?: string
  equipmentType?: string
}

export default function SendReminderButton({
  type,
  clientName,
  clientPhone,
  date,
  time = '10:00',
  equipmentType,
}: SendReminderButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const message = type === 'visit'
    ? `Здравствуйте, ${clientName}! Напоминаем о запланированном визите мастера ${date} в ${time}. Будем ждать вас!`
    : `Здравствуйте, ${clientName}! Прошло почти 11 месяцев с последнего обслуживания вашей техники (${equipmentType}). Рекомендуем провести профилактический осмотр для предотвращения поломок.`

  const handleSend = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      const result = await response.json()

      if (result.success) {
        alert('Сообщение отправлено!')
        setIsOpen(false)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      alert('Ошибка при отправке сообщения')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button size="sm" onClick={() => setIsOpen(true)}>
        <Send className="w-4 h-4 mr-1" />
        Отправить
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Отправка напоминания"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текст сообщения
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              value={message}
              readOnly
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCopy}
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? 'Скопировано!' : 'Копировать'}
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={loading}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Отправка...' : 'Отправить'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Сообщение будет отправлено через Telegram бота
          </p>
        </div>
      </Modal>
    </>
  )
}
