import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, test = false } = body

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Сообщение не указано' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не авторизован' },
        { status: 401 }
      )
    }

    // Получаем профиль пользователя
    const { data: profile } = await supabase
      .from('profiles')
      .select('telegram_token, telegram_chat_id')
      .eq('id', user.id)
      .single()

    const profileData = profile as any

    if (!profileData?.telegram_token || !profileData?.telegram_chat_id) {
      return NextResponse.json(
        { success: false, error: 'Telegram не настроен. Добавьте токен бота и Chat ID в настройках.' },
        { status: 400 }
      )
    }

    // Отправляем сообщение через Telegram API
    const telegramUrl = `https://api.telegram.org/bot${profileData.telegram_token}/sendMessage`

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: profileData.telegram_chat_id,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    const result = await response.json()

    if (!result.ok) {
      throw new Error(result.description || 'Ошибка Telegram API')
    }

    return NextResponse.json({ success: true, messageId: result.result?.message_id })
  } catch (error: any) {
    console.error('Telegram API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка при отправке сообщения' },
      { status: 500 }
    )
  }
}
