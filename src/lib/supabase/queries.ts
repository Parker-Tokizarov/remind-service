import { createClient } from '../supabase/server'

// Профили
export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return profile
}

export async function updateProfile(data: { full_name?: string; phone?: string; telegram_token?: string; telegram_chat_id?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Пользователь не авторизован')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (supabase as any)
    .from('profiles')
    .update(data)
    .eq('id', user.id)
}

// Клиенты
export async function getClients() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      orders (
        id,
        date,
        description,
        amount,
        visit_date
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function getClient(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      orders (
        id,
        date,
        description,
        amount,
        visit_date
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function createClientData(data: {
  name: string
  phone: string
  address?: string
  equipment_type: string
  last_visit_date?: string
  next_maintenance_date?: string
  notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Пользователь не авторизован')

  const clientData = {
    ...data,
    user_id: user.id,
    last_visit_date: data.last_visit_date || new Date().toISOString().split('T')[0],
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: client, error } = await (supabase as any)
    .from('clients')
    .insert(clientData)
    .select()
    .single()

  if (error) throw error
  return client
}

export async function updateClient(id: string, data: {
  name?: string
  phone?: string
  address?: string
  equipment_type?: string
  last_visit_date?: string
  next_maintenance_date?: string
  notes?: string
}) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: client, error } = await (supabase as any)
    .from('clients')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return client
}

export async function deleteClient(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Заказы
export async function getOrders(clientId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('orders')
    .select(`
      *,
      clients (
        id,
        name,
        phone
      )
    `)
  
  if (clientId) {
    query = query.eq('client_id', clientId)
  }
  
  const { data, error } = await query.order('date', { ascending: false })
  
  if (error) throw error
  return data
}

export async function createOrder(data: {
  client_id: string
  date: string
  description: string
  amount?: number
  visit_date?: string
}) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error } = await (supabase as any)
    .from('orders')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return order
}

export async function updateOrder(id: string, data: {
  date?: string
  description?: string
  amount?: number
  visit_date?: string
}) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error } = await (supabase as any)
    .from('orders')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return order
}

export async function deleteOrder(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Шаблоны
export async function getTemplates() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function createTemplate(data: {
  name: string
  type: 'visit' | 'maintenance'
  content: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Пользователь не авторизован')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: template, error } = await (supabase as any)
    .from('templates')
    .insert({ ...data, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return template
}

export async function updateTemplate(id: string, data: {
  name?: string
  type?: 'visit' | 'maintenance'
  content?: string
}) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: template, error } = await (supabase as any)
    .from('templates')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return template
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Аналитика
export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Пользователь не авторизован')
  
  // Количество клиентов
  const { count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
  
  // Заказы за текущий месяц
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  const { data: monthOrders } = await supabase
    .from('orders')
    .select('amount, date')
    .gte('date', startOfMonth.toISOString().split('T')[0])
    .lte('date', endOfMonth.toISOString().split('T')[0])

  const ordersCount = monthOrders?.length || 0
  const totalAmount = (monthOrders as any[])?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0
  
  // Заказы по дням за последние 7 дней
  const { data: dailyOrders } = await supabase
    .from('orders')
    .select('date')
    .gte('date', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  
  const ordersByDay: Record<string, number> = {}
  if (dailyOrders) {
    ;(dailyOrders as any[]).forEach(order => {
      const day = order.date.split('T')[0]
      ordersByDay[day] = (ordersByDay[day] || 0) + 1
    })
  }
  
  return {
    clientsCount: clientsCount || 0,
    ordersCount,
    totalAmount,
    ordersByDay,
  }
}

// Напоминания
export async function getReminders() {
  const supabase = await createClient()
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  
  const tomorrowStr = tomorrow.toISOString().split('T')[0]
  const oneMonthLaterStr = oneMonthLater.toISOString().split('T')[0]
  
  // Напоминания о визитах (завтра)
  const { data: visitReminders } = await supabase
    .from('orders')
    .select(`
      id,
      date,
      visit_date,
      description,
      clients (
        id,
        name,
        phone
      )
    `)
    .eq('visit_date', tomorrowStr)
    .is('visit_date', false)
  
  // Напоминания о профилактике (через месяц)
  const { data: maintenanceReminders } = await supabase
    .from('clients')
    .select(`
      id,
      name,
      phone,
      equipment_type,
      next_maintenance_date
    `)
    .not('next_maintenance_date', 'is', null)
    .lte('next_maintenance_date', oneMonthLaterStr)
    .gte('next_maintenance_date', tomorrowStr)
  
  return {
    visit: visitReminders || [],
    maintenance: maintenanceReminders || [],
  }
}
