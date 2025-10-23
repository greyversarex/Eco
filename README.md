# ЭкоТочикистон / EcoTajikistan

Внутренняя платформа обмена сообщениями и документами для Министерства охраны окружающей среды Таджикистана.

Internal messaging and document exchange platform for Tajikistan's Ministry of Environmental Protection.

---

## 🌟 Особенности / Features

- **Двуязычный интерфейс**: Таджикский и Русский
- **Безопасный обмен сообщениями**: Между 37 департаментами
- **Управление документами**: До 5 файлов по 100MB каждый
- **Админ-панель**: Управление департаментами и доступом
- **Полностью автономная**: Все данные в PostgreSQL (без внешних сервисов)
- **Готовность к мобильным приложениям**: API-first архитектура

---

- **Bilingual Interface**: Tajik and Russian
- **Secure Messaging**: Between 37 departments
- **Document Management**: Up to 5 files of 100MB each
- **Admin Panel**: Department and access management
- **Fully Autonomous**: All data in PostgreSQL (no external services)
- **Mobile-Ready**: API-first architecture

## 🚀 Быстрый старт / Quick Start

### Требования / Requirements

- Node.js 18+ 
- PostgreSQL 13+
- NPM 8+

### Установка / Installation

```bash
# 1. Клонируйте репозиторий / Clone repository
git clone <repository-url>
cd ecotajikistan

# 2. Установите зависимости / Install dependencies
npm install

# 3. Настройте базу данных / Setup database
# Создайте PostgreSQL базу / Create PostgreSQL database
createdb ecotajikistan

# 4. Настройте переменные окружения / Configure environment
cp .env.example .env
# Отредактируйте .env / Edit .env with your DATABASE_URL

# 5. Примените миграции / Run migrations
npm run db:migrate

# 6. Создайте администратора и департаменты / Create admin and departments
npm run db:seed

# 7. Запустите приложение / Start application
npm run dev
```

Приложение будет доступно на `http://localhost:5000`

Application will be available at `http://localhost:5000`

## 📁 Структура проекта / Project Structure

```
ecotajikistan/
├── client/              # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/  # React компоненты / React components
│   │   ├── pages/       # Страницы приложения / App pages
│   │   ├── lib/         # Утилиты / Utilities
│   │   └── hooks/       # React hooks
├── server/              # Backend (Express.js + TypeScript)
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Слой работы с БД / Database layer
│   ├── db.ts            # Подключение к БД / DB connection
│   └── index.ts         # Точка входа / Entry point
├── shared/              # Общие типы и схемы / Shared types and schemas
│   └── schema.ts        # Drizzle ORM schema
└── DEPLOYMENT.md        # Полное руководство / Full deployment guide
```

## 🔧 Доступные команды / Available Commands

```bash
# Разработка / Development
npm run dev              # Запуск dev сервера / Start dev server
npm run db:generate      # Сгенерировать миграции / Generate migrations
npm run db:migrate       # Применить миграции / Apply migrations
npm run db:seed          # Создать тестовые данные / Create seed data

# Production
npm start                # Запуск production сервера / Start production server
npm run build            # Сборка для production / Build for production
```

## 🔐 Безопасность / Security

- ✅ SQL Injection защита через Drizzle ORM
- ✅ XSS защита через React
- ✅ CSRF защита через session cookies (httpOnly, sameSite)
- ✅ Хеширование паролей через bcrypt
- ✅ MIME type валидация файлов
- ✅ Строгая авторизация доступа к данным

## 📊 Технологический стек / Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (сборка / build tool)
- Wouter (роутинг / routing)
- TanStack Query (состояние сервера / server state)
- Tailwind CSS + shadcn/ui (стили / styling)
- Radix UI (компоненты / components)

### Backend
- Node.js + Express.js
- TypeScript
- Drizzle ORM (база данных / database)
- PostgreSQL (хранилище / storage)
- Bcrypt (безопасность / security)
- Multer (загрузка файлов / file uploads)

## 📝 Переменные окружения / Environment Variables

```env
# Обязательно / Required
DATABASE_URL=postgresql://user:password@localhost:5432/ecotajikistan

# Опционально / Optional
SESSION_SECRET=your-secret-key-here
NODE_ENV=production
```

## 🚢 Развертывание / Deployment

Полное руководство по развертыванию см. в [DEPLOYMENT.md](./DEPLOYMENT.md)

For complete deployment guide see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Быстрое развертывание / Quick Deployment

1. Клонируйте репозиторий на сервер / Clone repository to server
2. Настройте PostgreSQL / Setup PostgreSQL
3. Установите зависимости: `npm install`
4. Настройте `.env` файл / Configure `.env` file
5. Примените миграции: `npm run db:migrate`
6. Создайте данные: `npm run db:seed`
7. Запустите: `npm start` или используйте PM2

## 📖 Документация / Documentation

- [Руководство по развертыванию / Deployment Guide](./DEPLOYMENT.md)
- [Техническая архитектура / Technical Architecture](./replit.md)
- [Руководство по дизайну / Design Guidelines](./design_guidelines.md)

## 🎯 Основные функции / Core Features

### Для департаментов / For Departments
- Вход по коду доступа / Login with access code
- Отправка/получение сообщений / Send/receive messages
- Прикрепление документов (до 5 файлов по 100MB) / Attach documents (up to 5 files, 100MB each)
- Просмотр входящих/исходящих сообщений / View inbox/outbox
- Чат между департаментами / Inter-department chat

### Для администраторов / For Administrators
- Управление департаментами / Manage departments
- Генерация кодов доступа / Generate access codes
- Просмотр всех сообщений / View all messages
- Статистика системы / System statistics

## 🛠️ Разработка / Development

### Добавление новой функции / Adding a New Feature

1. Обновите схему БД в `shared/schema.ts`
2. Добавьте методы в `server/storage.ts`
3. Создайте API endpoints в `server/routes.ts`
4. Создайте React компоненты в `client/src/`
5. Сгенерируйте миграции: `npm run db:generate`
6. Примените миграции: `npm run db:migrate`

### Тестирование / Testing

```bash
# Запустите приложение локально / Run app locally
npm run dev

# Проверьте логи / Check logs
# Логи сервера выводятся в консоль / Server logs output to console

# Проверьте БД / Check database
psql $DATABASE_URL
```

## 🔄 Обновление / Updating

```bash
git pull origin main
npm install
npm run db:migrate
pm2 restart ecotajikistan  # or systemctl restart ecotajikistan
```

## 🐛 Устранение неполадок / Troubleshooting

**Проблема:** Не удается подключиться к базе данных
```bash
# Проверьте строку подключения / Check connection string
echo $DATABASE_URL
psql $DATABASE_URL -c "SELECT 1"
```

**Проблема:** Порт 5000 занят
```bash
# Найдите процесс / Find process
lsof -i :5000
# Остановите процесс / Kill process
kill -9 <PID>
```

## 📄 Лицензия / License

Proprietary - Министерство охраны окружающей среды Таджикистана

Proprietary - Ministry of Environmental Protection of Tajikistan

## 👥 Поддержка / Support

Для вопросов и поддержки обратитесь к системному администратору.

For questions and support, contact your system administrator.

---

**Версия:** 1.0.0  
**Последнее обновление:** Октябрь 2025
