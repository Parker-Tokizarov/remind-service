# Инструкция: Публикация на GitHub и настройка Supabase

## 📦 Часть 1: Публикация на GitHub

### Шаг 1: Создайте репозиторий на GitHub

1. Откройте [github.com](https://github.com)
2. Войдите в свой аккаунт
3. Нажмите **+** → **New repository**
4. Заполните:
   - **Repository name**: `remind-service`
   - **Description**: Сервис напоминаний для мастеров по ремонту бытовой техники
   - **Public** или **Private** (на ваш выбор)
   - ❌ **Не ставьте** галочки "Add README" и другие
5. Нажмите **Create repository**

### Шаг 2: Инициализируйте Git и запушьте код

Откройте PowerShell в папке проекта и выполните команды:

```powershell
cd "C:\Users\Andre\Desktop\VS\remind-service"

# Инициализация Git
git init

# Добавление всех файлов
git add .

# Первый коммит
git commit -m "Initial commit: RemindService MVP"

# Переименуйте ветку в main
git branch -M main

# Добавьте удалённый репозиторий (замените YOUR_USERNAME на ваш логин GitHub)
git remote add origin https://github.com/YOUR_USERNAME/remind-service.git

# Отправьте код на GitHub
git push -u origin main
```

**Важно:** Если у вас не настроен Git, выполните:
```bash
git config --global user.name "Ваше Имя"
git config --global user.email "your-email@example.com"
```

### Шаг 3: Проверьте .gitignore

Файл `.gitignore` уже создан и содержит:
- `.env.local` — ваши секреты не попадут в репозиторий
- `node_modules/` — зависимости
- `.next/` — файлы сборки

---

## 🗄️ Часть 2: Настройка Supabase

### Шаг 1: Создайте проект в Supabase

1. Откройте [supabase.com](https://supabase.com)
2. Нажмите **Start your project** или **Sign in**
3. Войдите через GitHub (рекомендуется) или создайте аккаунт
4. В дашборде нажмите **+ New project**
5. Заполните:
   - **Name**: `RemindService`
   - **Database password**: `RemindService2026!` (или свой надёжный пароль)
   - **Region**: Выберите ближайшую (например, Frankfurt для Европы)
6. Нажмите **Create new project**

⏱️ Создание проекта займёт 1-2 минуты. Дождитесь зелёной галочки.

### Шаг 2: Получите API ключи

1. В левом меню нажмите **Settings** (шестерёнка)
2. Выберите **API**
3. Скопируйте два значения:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (длинная строка)

### Шаг 3: Настройте .env.local

Откройте файл `.env.local` в корне проекта и замените:

```env
# Было (заглушки):
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Стало (ваши значения):
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Шаг 4: Создайте таблицы в базе данных

1. В проекте Supabase перейдите в **SQL Editor** (в левом меню, иконка с кодом)
2. Нажмите **New Query**
3. Откройте файл `schema.sql` из проекта и скопируйте всё содержимое
4. Вставьте в SQL Editor
5. Нажмите **Run** (или Ctrl+Enter)

✅ Вы должны увидеть сообщение "Success. No rows returned"

### Шаг 5: Проверьте создание таблиц

1. Перейдите в **Table Editor** (в левом меню)
2. Вы должны увидеть 4 таблицы:
   - `profiles`
   - `clients`
   - `orders`
   - `templates`

### Шаг 6: Настройте аутентификацию

1. Перейдите в **Authentication** → **Providers**
2. Убедитесь, что **Email** включён (зелёный)
3. Для тестирования отключите подтверждение email:
   - Перейдите в **Authentication** → **Settings**
   - Найдите **Email Auth**
   - Отключите **Confirm email** (для быстрого тестирования)

---

## 🚀 Часть 3: Запуск приложения

### Локальный запуск

```powershell
cd "C:\Users\Andre\Desktop\VS\remind-service"
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

### Первая регистрация

1. Нажмите **Зарегистрироваться**
2. Введите:
   - Email: `test@example.com`
   - Пароль: `test123456`
   - ФИО: `Иван Иванов`
   - Телефон: `+7 (999) 000-00-00`
3. Нажмите **Зарегистрироваться**
4. Вы попадёте на дашборд

---

## ☁️ Часть 4: Деплой на Vercel

### Шаг 1: Подключите репозиторий к Vercel

1. Откройте [vercel.com](https://vercel.com)
2. Войдите через GitHub
3. Нажмите **Add New Project**
4. Выберите **Import Git Repository**
5. Найдите ваш репозиторий `remind-service`
6. Нажмите **Import**

### Шаг 2: Настройте переменные окружения

В настройках проекта на Vercel:

1. Перейдите в **Settings** → **Environment Variables**
2. Добавьте две переменные:
   - `NEXT_PUBLIC_SUPABASE_URL` = ваш Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = ваш anon public ключ
3. Нажмите **Save**

### Шаг 3: Задеплойте

1. Перейдите в **Deployments**
2. Нажмите **Redeploy** на последнем деплое
3. Дождитесь завершения (зелёная галочка)
4. Откройте ваш домен (например: `remind-service.vercel.app`)

---

## 🔧 Часть 5: Настройка Telegram (опционально)

### Создание бота

1. Откройте Telegram, найдите [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Введите имя бота: `RemindService Bot`
4. Введите username: `RemindServiceTestBot` (должен заканчиваться на `bot`)
5. Скопируйте полученный токен (выглядит как: `123456789:ABCdef...`)

### Получение Chat ID

1. Найдите своего бота в Telegram, нажмите **Start**
2. Найдите бота [@userinfobot](https://t.me/userinfobot)
3. Отправьте ему любое сообщение
4. Скопируйте ваш Chat ID (число, например: `123456789`)

### Настройка в приложении

1. Откройте приложение → **Настройки**
2. Вставьте токен и Chat ID
3. Нажмите **Тест** для проверки

---

## ✅ Чек-лист готовности

- [ ] Проект создан на GitHub
- [ ] Код запушен в репозиторий
- [ ] Проект создан в Supabase
- [ ] Таблицы созданы (4 таблицы)
- [ ] Файл `.env.local` настроен
- [ ] Приложение запускается локально
- [ ] Регистрация работает
- [ ] (Опционально) Telegram настроен
- [ ] (Опционально) Приложение задеплоено на Vercel

---

## 🐛 Решение проблем

### Ошибка: "Failed to fetch" при регистрации
- Проверьте правильность URL и ключей в `.env.local`
- Убедитесь, что проект в Supabase активен

### Ошибка: "Email already exists"
- Используйте другой email для тестирования
- Или удалите пользователя в Supabase: **Authentication** → **Users**

### Ошибка: "relation does not exist"
- Выполните `schema.sql` в SQL Editor
- Проверьте, что все 4 таблицы созданы

### Ошибка при деплое на Vercel
- Проверьте переменные окружения в настройках проекта
- Убедитесь, что имена переменных точные

---

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте консоль браузера (F12) на ошибки
2. Проверьте логи в Supabase: **Settings** → **Logs**
3. Проверьте логи на Vercel: **Deployments** → кликните на деплой → **View Build Logs**
