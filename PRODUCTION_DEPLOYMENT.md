# ЭкоТочикистон - Полное Руководство по Развертыванию Production-Версии

## 📋 Оглавление
1. [Предварительные Требования](#предварительные-требования)
2. [Архитектура Production-Системы](#архитектура-production-системы)
3. [Подготовка Supabase Storage](#подготовка-supabase-storage)
4. [Пошаговая Инструкция по Развертыванию](#пошаговая-инструкция-по-развертыванию)
5. [Обновление Существующего Сервера](#обновление-существующего-сервера)
6. [Проверка и Тестирование](#проверка-и-тестирование)
7. [Устранение Проблем](#устранение-проблем)

---

## 🎯 Предварительные Требования

### Инфраструктура
- ✅ VDS сервер на Ubuntu 22.04 (TimeWeb)
- ✅ Node.js 18+ установлен
- ✅ PostgreSQL база данных (Neon Database)
- ✅ Nginx для reverse proxy
- ✅ PM2 для управления процессами
- ✅ Git для получения кода

### Внешние Сервисы
- ✅ **Supabase Project** с созданным Storage bucket
- ✅ **Neon Database** с подключением PostgreSQL
- ✅ **GitHub Repository** с кодом проекта

---

## 🏗️ Архитектура Production-Системы

```
┌─────────────────────────────────────────────────┐
│           Nginx (Reverse Proxy)                 │
│              Port 80/443                        │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│        Node.js + Express Server                 │
│              Port 5000                          │
│         (Managed by PM2)                        │
└─────────┬─────────────────────┬─────────────────┘
          │                     │
          ▼                     ▼
┌──────────────────┐  ┌────────────────────────┐
│  Neon PostgreSQL │  │  Supabase Storage      │
│   (Database)     │  │  (File Storage)        │
└──────────────────┘  └────────────────────────┘
```

**Ключевые Компоненты:**
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Neon - serverless)
- **File Storage**: Supabase Storage (S3-compatible)
- **Sessions**: PostgreSQL session store (connect-pg-simple)

---

## ☁️ Подготовка Supabase Storage

### Шаг 1: Создание Supabase Проекта

1. **Перейдите на https://supabase.com**
2. **Войдите или зарегистрируйтесь**
3. **Создайте новый проект:**
   - Имя проекта: `ecotajikistan` (или любое другое)
   - Database Password: (запомните его!)
   - Region: выберите ближайший к Таджикистану (Europe/Frankfurt)
   - Plan: Free tier достаточно для начала

### Шаг 2: Создание Storage Bucket

1. **В панели Supabase перейдите в Storage:**
   ```
   Dashboard → Storage → Create a new bucket
   ```

2. **Настройки bucket:**
   - **Name**: `ecotajikistan-files`
   - **Public bucket**: ❌ **НЕТ** (файлы должны быть приватными)
   - **File size limit**: 100 MB
   - **Allowed MIME types**: Оставьте пустым (разрешить все)

3. **Нажмите "Create bucket"**

### Шаг 3: Получение Credentials

1. **Перейдите в Project Settings → API:**
   ```
   Settings → API
   ```

2. **Скопируйте следующие данные:**
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: (НЕ используем для сервера!)
   - **service_role key**: ⚠️ **ВАЖНО! Это ваш секретный ключ для сервера**

⚠️ **КРИТИЧЕСКИ ВАЖНО**: 
- Используйте **service_role** ключ, а НЕ anon key
- Никогда не коммитьте service_role key в Git
- Service role key обходит Row Level Security (RLS) политики

### Шаг 4: Настройка RLS Policies (Опционально)

Для дополнительной безопасности вы можете настроить RLS policies:

```sql
-- Разрешить service role доступ ко всему
-- (По умолчанию service_role уже обходит RLS, но для явности)

-- Создать policy для аутентифицированных пользователей (если нужно)
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ecotajikistan-files');

CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'ecotajikistan-files');
```

**Примечание**: Так как ваше приложение использует собственную систему аутентификации (не Supabase Auth), RLS policies не обязательны. Service role key даст серверу полный доступ.

---

## 🚀 Пошаговая Инструкция по Развертыванию

### ЭТАП 1: Подготовка Локального Репозитория (Replit)

**На Replit выполните:**

```bash
# Убедитесь, что все изменения закоммичены
git status

# Если есть незакоммиченные изменения, добавьте их
git add .
git commit -m "Готово к production: миграция на Supabase Storage"

# Отправьте код на GitHub
git push origin main
```

---

### ЭТАП 2: Подключение к VDS Серверу

```bash
# Подключитесь к вашему серверу через SSH
ssh your-username@your-server-ip

# Или используйте имя хоста
ssh your-username@your-domain.com
```

---

### ЭТАП 3: Остановка Текущего Приложения

```bash
# Перейдите в директорию проекта
cd /var/www/ecotajikistan
# (замените на вашу фактическую директорию)

# Остановите PM2 процесс
pm2 stop ecotajikistan
# ИЛИ если используете systemd:
# sudo systemctl stop ecotajikistan

# Проверьте, что приложение остановлено
pm2 status
```

---

### ЭТАП 4: Создание Резервной Копии

⚠️ **НЕ ПРОПУСКАЙТЕ ЭТОТ ШАГ!**

```bash
# 1. Backup базы данных
# Получите DATABASE_URL из .env
source .env
echo $DATABASE_URL

# Создайте backup
pg_dump "$DATABASE_URL" -F c -f ~/ecotajikistan_backup_$(date +%Y%m%d_%H%M%S).dump

# 2. Backup файлов проекта
cd /var/www
tar -czf ~/ecotajikistan_files_backup_$(date +%Y%m%d_%H%M%S).tar.gz ecotajikistan/

# 3. Backup .env файла (ВАЖНО!)
cp ecotajikistan/.env ~/ecotajikistan_env_backup_$(date +%Y%m%d_%H%M%S).env

echo "✅ Backup завершен! Файлы сохранены в ~/ecotajikistan_backup_*"
ls -lh ~/ecotajikistan_*backup*
```

---

### ЭТАП 5: Обновление Кода с GitHub

```bash
# Перейдите в директорию проекта
cd /var/www/ecotajikistan

# Сохраните локальные изменения (если есть)
git stash

# Получите последнюю версию с GitHub
git pull origin main

# Если были конфликты, разрешите их
# git stash pop
```

---

### ЭТАП 6: Обновление Зависимостей

```bash
# Удалите старые node_modules для чистой установки
rm -rf node_modules package-lock.json

# Установите все зависимости (включая @supabase/storage-js)
npm install

# Проверьте, что Supabase Storage установлен
npm list @supabase/storage-js

# Должно вывести: @supabase/storage-js@x.x.x
```

**Ожидаемый результат:**
```
✅ added 545 packages
✅ @supabase/storage-js установлен
❌ @google-cloud/storage удален
```

---

### ЭТАП 7: Конфигурация Environment Variables

```bash
# Откройте .env файл
nano .env
```

**Обновите/добавьте следующие переменные:**

```bash
# ===================================
# DATABASE (Neon PostgreSQL)
# ===================================
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# ===================================
# SUPABASE STORAGE (НОВЫЕ ПЕРЕМЕННЫЕ!)
# ===================================
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_STORAGE_BUCKET=ecotajikistan-files

# ===================================
# APPLICATION
# ===================================
SESSION_SECRET=your-session-secret-here
NODE_ENV=production
PORT=5000
```

**Сохраните файл:**
- Нажмите `Ctrl + O` → Enter (сохранить)
- Нажмите `Ctrl + X` (выйти)

**Проверьте конфигурацию:**

```bash
# Убедитесь, что все переменные установлены
cat .env | grep -E "SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_STORAGE_BUCKET|DATABASE_URL|SESSION_SECRET"
```

**Должно вывести все 5 переменных с заполненными значениями!**

---

### ЭТАП 8: Обновление Базы Данных

⚠️ **ВАЖНО**: Этот проект использует Supabase Storage вместо старого решения, но схема БД осталась прежней.

```bash
# Проверьте, что schema.ts не имеет изменений в БД
# (В этой миграции схема БД не менялась, только хранилище файлов)

# Если нужно, выполните миграцию (в данном случае не требуется)
# npm run db:push
```

**В этом обновлении схема БД НЕ изменилась**, поэтому миграция не нужна!

---

### ЭТАП 9: Сборка Production-Версии

```bash
# Соберите фронтенд и бэкенд
npm run build
```

**Ожидаемый вывод:**
```
✓ built in XXXms
✓ dist/index.js created
✓ client/ bundle created
```

**Проверьте результат:**

```bash
ls -lh dist/
# Должны быть: index.js и другие файлы
```

---

### ЭТАП 10: Запуск Приложения

#### Вариант A: Использование PM2 (Рекомендуется)

```bash
# Запустите приложение через PM2
pm2 start ecosystem.config.js

# Сохраните конфигурацию PM2 для автозапуска
pm2 save
pm2 startup

# Проверьте статус
pm2 status
```

#### Вариант B: Использование systemd

```bash
# Запустите через systemd
sudo systemctl start ecotajikistan

# Проверьте статус
sudo systemctl status ecotajikistan
```

**Ожидаемый результат:**

```
┌─────┬────────────────┬─────────┬──────┬─────┬──────────┐
│ id  │ name           │ mode    │ ↺    │ status │ cpu  │
├─────┼────────────────┼─────────┼──────┼─────┼──────────┤
│ 0   │ ecotajikistan  │ fork    │ 0    │ online │ 0%   │
└─────┴────────────────┴─────────┴──────┴─────┴──────────┘
```

---

### ЭТАП 11: Проверка Логов

```bash
# Проверьте логи PM2
pm2 logs ecotajikistan --lines 50

# ИЛИ через systemd:
# sudo journalctl -u ecotajikistan -n 50 -f
```

**Что искать в логах:**

✅ **Хорошие сообщения:**
```
[express] serving on port 5000
Database connected successfully
Server started successfully
```

❌ **Плохие сообщения:**
```
Error: SUPABASE_URL environment variable must be set
Error: Failed to connect to database
ECONNREFUSED
```

Если видите ошибки, перейдите к разделу [Устранение Проблем](#устранение-проблем).

---

### ЭТАП 12: Проверка Nginx

```bash
# Проверьте конфигурацию Nginx
sudo nginx -t

# Если конфигурация валидна, перезапустите Nginx
sudo systemctl reload nginx

# Проверьте статус
sudo systemctl status nginx
```

---

## 🔄 Обновление Существующего Сервера

Если у вас уже работает сервер и вы хотите обновить его:

```bash
# Быстрая последовательность команд для обновления
cd /var/www/ecotajikistan
pm2 stop ecotajikistan
git pull origin main
npm install
nano .env  # Добавьте Supabase переменные (см. Этап 7)
npm run build
pm2 restart ecotajikistan
pm2 logs ecotajikistan --lines 20
```

**Время обновления:** ~5-10 минут
**Время простоя:** ~2-3 минуты

---

## ✅ Проверка и Тестирование

### 1. Проверка Доступности Сайта

```bash
# Проверьте, что сайт отвечает
curl -I http://localhost:5000

# Ожидаемый результат:
# HTTP/1.1 200 OK
```

### 2. Проверка в Браузере

Откройте ваш сайт в браузере:

1. ✅ **Вход в систему работает**
2. ✅ **Старые сообщения отображаются**
3. ✅ **Старые вложения можно скачать**
4. ✅ **Можно создать новое сообщение**
5. ✅ **Можно загрузить несколько файлов** (до 5 штук, 100 MB каждый)
6. ✅ **Файлы загружаются с прогресс-баром**
7. ✅ **Загруженные файлы отображаются в сообщении**
8. ✅ **Файлы можно скачать** (каждый файл отдельно)

### 3. Проверка Supabase Storage

1. **Зайдите в Supabase Dashboard:**
   ```
   https://app.supabase.com/project/your-project/storage/buckets
   ```

2. **Откройте bucket `ecotajikistan-files`**

3. **Проверьте папку `uploads/`**
   - Должны быть загруженные файлы с UUID именами
   - Пример: `uploads/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### 4. Тест Загрузки Файла

1. **Войдите в систему как департамент**
2. **Создайте новое сообщение**
3. **Загрузите 3 разных файла** (например: PDF, JPG, DOCX)
4. **Проверьте прогресс-бар для каждого файла**
5. **Отправьте сообщение**
6. **Откройте отправленное сообщение**
7. **Скачайте каждый файл и убедитесь, что они корректны**

---

## 🔧 Устранение Проблем

### Проблема 1: Ошибка "SUPABASE_URL not set"

**Решение:**

```bash
# Проверьте .env файл
cat .env | grep SUPABASE

# Если переменные пустые, добавьте их:
nano .env

# Добавьте:
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key-here
SUPABASE_STORAGE_BUCKET=ecotajikistan-files

# Сохраните и перезапустите
pm2 restart ecotajikistan
```

### Проблема 2: Файлы не загружаются

**Диагностика:**

```bash
# Проверьте логи PM2
pm2 logs ecotajikistan --lines 100 | grep -i "upload\|supabase\|error"
```

**Возможные причины:**

1. **Неправильный Service Role Key**
   - Убедитесь, что используете `service_role` key, а НЕ `anon` key

2. **Bucket не существует**
   - Проверьте в Supabase Dashboard, что bucket `ecotajikistan-files` создан

3. **Недостаточно прав**
   - Service role key должен иметь полные права на Storage

**Решение:**

```bash
# Проверьте credentials в Supabase Dashboard
# Settings → API → service_role key

# Обновите .env файл с правильным ключом
nano .env

# Перезапустите
pm2 restart ecotajikistan
```

### Проблема 3: Файлы не скачиваются

**Проверка:**

```bash
# Откройте браузер DevTools (F12)
# Network → попробуйте скачать файл
# Посмотрите на статус ответа (должен быть 200)
```

**Возможные причины:**

1. **Файл не найден в Supabase**
   - URL файла неправильно сохранен в БД

2. **Ошибка signed URL**
   - Supabase не может создать signed URL

**Решение:**

```bash
# Проверьте логи
pm2 logs ecotajikistan | grep "download"

# Проверьте, что файлы есть в Supabase Storage
# Dashboard → Storage → ecotajikistan-files → uploads/
```

### Проблема 4: "Cannot find module @supabase/storage-js"

**Решение:**

```bash
# Переустановите зависимости
rm -rf node_modules package-lock.json
npm install

# Проверьте установку
npm list @supabase/storage-js

# Пересоберите
npm run build

# Перезапустите
pm2 restart ecotajikistan
```

### Проблема 5: Старые файлы (из Google Cloud) не скачиваются

**Это ожидаемое поведение!**

Старые файлы, загруженные в Google Cloud Storage (Replit), **НЕ будут доступны** после миграции на Supabase.

**Решение (если нужно сохранить старые файлы):**

1. **Экспортируйте файлы из старой системы перед миграцией**
2. **Загрузите их в Supabase Storage вручную**
3. **Обновите URL в базе данных**

**Примечание**: Если старых файлов нет или они не критичны, пропустите этот шаг.

---

## 📊 Мониторинг Production

### Проверка Статуса Приложения

```bash
# Статус PM2
pm2 status

# Использование ресурсов
pm2 monit

# Логи в реальном времени
pm2 logs ecotajikistan --lines 100
```

### Проверка Supabase Usage

1. **Зайдите в Supabase Dashboard**
2. **Reports → Storage**
3. **Проверьте:**
   - Количество файлов
   - Использованное пространство
   - Количество запросов

### Автоматический Перезапуск

```bash
# PM2 автоматически перезапустит приложение при сбоях

# Проверьте автозапуск после reboot
pm2 startup
pm2 save
```

---

## 🔐 Безопасность Production

### Переменные Окружения

✅ **Правильно:**
- Хранить credentials в `.env` файле
- Добавить `.env` в `.gitignore`
- Использовать `service_role` key для сервера

❌ **Неправильно:**
- Коммитить `.env` в Git
- Использовать `anon` key вместо `service_role`
- Хранить ключи в коде

### HTTPS

Убедитесь, что ваш сайт работает по HTTPS:

```bash
# Установите Let's Encrypt сертификат
sudo certbot --nginx -d your-domain.com
```

### Firewall

```bash
# Разрешите только необходимые порты
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

---

## 📝 Финальный Чеклист

После завершения deployment'а:

- [ ] Приложение запущено и доступно через браузер
- [ ] Вход в систему работает
- [ ] Старые сообщения отображаются
- [ ] Можно создать новое сообщение
- [ ] Можно загрузить множественные файлы (до 5 штук)
- [ ] Прогресс-бар работает при загрузке
- [ ] Файлы сохраняются в Supabase Storage
- [ ] Файлы можно скачать из сообщений
- [ ] В логах нет критических ошибок
- [ ] PM2 настроен на автозапуск
- [ ] Backup создан и сохранен
- [ ] .env файл содержит все необходимые переменные
- [ ] HTTPS настроен (опционально, но рекомендуется)

---

## 🎯 Заключение

**Поздравляем!** Вы успешно развернули production-версию ЭкоТочикистон с Supabase Storage.

**Что было сделано:**
- ✅ Мигрировали с Replit Object Storage на Supabase Storage
- ✅ Настроили production-ready файловое хранилище
- ✅ Обеспечили безопасность через service_role key
- ✅ Сохранили обратную совместимость со старыми сообщениями
- ✅ Реализовали надежную систему загрузки и скачивания файлов

**Следующие Шаги:**
1. Мониторьте логи первые 24 часа
2. Проверьте использование Supabase Storage quota
3. Настройте автоматические backup'ы базы данных
4. Рассмотрите настройку monitoring (например, Uptime Robot)

**Удачи с вашим проектом!** 🚀

---

## 📞 Техническая Поддержка

При возникновении проблем:

1. **Проверьте логи**: `pm2 logs ecotajikistan`
2. **Проверьте .env**: Все переменные заполнены?
3. **Проверьте Supabase Dashboard**: Bucket создан?
4. **Проверьте Network в DevTools**: Какие ошибки возвращает API?

**Общие команды для диагностики:**

```bash
# Проверить статус всех сервисов
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql  # если локальная БД

# Проверить переменные окружения
cat .env

# Проверить логи
pm2 logs --lines 200
tail -f /var/log/nginx/error.log

# Проверить подключение к БД
psql "$DATABASE_URL" -c "SELECT version();"

# Тест Supabase connection (добавьте временно в код)
curl -X GET "${SUPABASE_URL}/storage/v1/bucket" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
```

---

**Версия документа**: 1.0  
**Последнее обновление**: $(date +%Y-%m-%d)  
**Автор**: ЭкоТочикистон Development Team
