-- RemindService Schema for Supabase
-- Этот файл создает все необходимые таблицы, триггеры и политики RLS

-- Включаем расширение UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица профилей (расширяет auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  telegram_token TEXT,
  telegram_chat_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица клиентов
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  equipment_type TEXT NOT NULL,
  last_visit_date DATE DEFAULT CURRENT_DATE,
  next_maintenance_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  visit_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица шаблонов
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('visit', 'maintenance')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);
CREATE INDEX IF NOT EXISTS idx_orders_visit_date ON orders(visit_date);
CREATE INDEX IF NOT EXISTS idx_clients_next_maintenance ON clients(next_maintenance_date);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);

-- Триггер для создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, created_at)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Политики Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Профили: пользователь видит только свой профиль
CREATE POLICY "Пользователи видят только свой профиль"
  ON profiles FOR ALL
  USING (auth.uid() = id);

-- Клиенты: пользователь видит только своих клиентов
CREATE POLICY "Пользователи видят только своих клиентов"
  ON clients FOR ALL
  USING (auth.uid() = user_id);

-- Заказы: пользователь видит только заказы своих клиентов
CREATE POLICY "Пользователи видят только заказы своих клиентов"
  ON orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = orders.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Шаблоны: пользователь видит только свои шаблоны
CREATE POLICY "Пользователи видят только свои шаблоны"
  ON templates FOR ALL
  USING (auth.uid() = user_id);

-- Вставка шаблонов по умолчанию
INSERT INTO templates (user_id, name, type, content)
SELECT 
  auth.uid(),
  'Напоминание о визите',
  'visit',
  'Здравствуйте, {clientName}! Напоминаем о запланированном визите мастера {date} в {time}. Будем ждать вас!'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() IS NOT NULL)
ON CONFLICT DO NOTHING;

INSERT INTO templates (user_id, name, type, content)
SELECT 
  auth.uid(),
  'Предложение профилактики',
  'maintenance',
  'Здравствуйте, {clientName}! Прошло почти 11 месяцев с последнего обслуживания вашей техники ({equipmentType}). Рекомендуем провести профилактический осмотр для предотвращения поломок.'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() IS NOT NULL)
ON CONFLICT DO NOTHING;
