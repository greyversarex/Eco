# 🚀 Настройка Production Сервера (HTTP)

## Обзор изменений

Сервер теперь настроен для работы **по HTTP** (без HTTPS) с поддержкой мобильных приложений.

## ⚙️ Переменные окружения

### Обязательные

```bash
# Секретный ключ для сессий (обязательно!)
SESSION_SECRET=your-super-secret-key-min-32-chars

# База данных PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database
```

### Опциональные

```bash
# Разрешенные origins для CORS (разделенные запятыми)
# Пример: http://192.168.1.100:5000,http://example.com
ALLOWED_ORIGINS=http://your-server-ip:5000

# Включить secure cookies (только для HTTPS)
# По умолчанию: false (для HTTP)
SECURE_COOKIES=false

# Порт сервера (по умолчанию: 5000)
PORT=5000

# Окружение
NODE_ENV=production
```

## 📱 Поддержка мобильных приложений

### CORS настройка

Сервер автоматически **разрешает запросы без origin** (мобильные приложения):

```typescript
// Пропускает:
// 1. Запросы без origin (мобильные приложения)
// 2. Origins из ALLOWED_ORIGINS
// 3. Все запросы в development режиме

if (!origin || allowedOrigins.includes(origin)) {
  callback(null, true);
}
```

### Отладка CORS

Если запрос блокируется, в логах появится:

```
Blocked by CORS: http://unauthorized-domain.com
```

## 🔒 Безопасность

### Helmet (защита заголовков)

```typescript
helmet({
  contentSecurityPolicy: false,        // ✅ Отключено для мобильных ассетов
  crossOriginEmbedderPolicy: false,   // ✅ Отключено для мобильных ассетов
})
```

### Сессии и Cookies

```typescript
cookie: {
  httpOnly: true,           // ✅ Защита от XSS
  secure: false,            // ✅ Работает по HTTP
  sameSite: 'lax',         // ✅ Совместимость с мобильными
  maxAge: 30 дней
}
```

**Важно:** 
- `secure: false` - позволяет работать по HTTP
- `sameSite: 'lax'` - куки проходят в мобильных приложениях

## 🌐 Примеры настройки

### Локальная разработка

```bash
# .env (development)
NODE_ENV=development
SESSION_SECRET=dev-secret-key-12345678901234567890
DATABASE_URL=postgresql://localhost:5432/ecodoc_dev
PORT=5000
```

### Production сервер (HTTP по IP)

```bash
# .env.production
NODE_ENV=production
SESSION_SECRET=super-secret-production-key-min-32-characters-long
DATABASE_URL=postgresql://user:password@localhost:5432/ecodoc_prod
PORT=5000

# Разрешить доступ с IP адреса сервера
ALLOWED_ORIGINS=http://192.168.1.100:5000

# Cookies по HTTP
SECURE_COOKIES=false
```

### Production сервер (HTTPS с доменом)

```bash
# .env.production
NODE_ENV=production
SESSION_SECRET=super-secret-production-key-min-32-characters-long
DATABASE_URL=postgresql://user:password@localhost:5432/ecodoc_prod
PORT=5000

# Разрешить доступ с домена
ALLOWED_ORIGINS=https://ecodoc.example.com

# Включить secure cookies для HTTPS
SECURE_COOKIES=true
```

## 🔍 Проверка работы

### Тест сервера

```bash
curl http://your-server-ip:5000/api/auth/me

# Ожидаемый ответ (если не залогинен):
{"error":"Not authenticated"}
```

### Проверка CORS

```bash
# Запрос от мобильного приложения (без Origin)
curl -X POST http://your-server-ip:5000/api/auth/department/login \
  -H "Content-Type: application/json" \
  -d '{"accessCode":"CODE123"}'

# Должен пройти успешно ✅
```

### Проверка блокировки CORS

```bash
# Запрос с неразрешенного origin
curl http://your-server-ip:5000/api/auth/me \
  -H "Origin: http://bad-domain.com"

# В логах сервера появится:
# Blocked by CORS: http://bad-domain.com
```

## 📋 Checklist для деплоя

- [ ] Установить `SESSION_SECRET` (минимум 32 символа)
- [ ] Настроить `DATABASE_URL` с корректными учетными данными
- [ ] Добавить IP/домен сервера в `ALLOWED_ORIGINS`
- [ ] Установить `SECURE_COOKIES=false` для HTTP
- [ ] Проверить что `NODE_ENV=production`
- [ ] Убедиться что PostgreSQL запущен и доступен
- [ ] Запустить `npm run build` для сборки
- [ ] Запустить `npm start` для production сервера
- [ ] Протестировать вход с веб-интерфейса
- [ ] Протестировать вход из мобильного приложения

## 🛠️ Команды для деплоя

```bash
# 1. Установка зависимостей
npm install

# 2. Сборка frontend
npm run build

# 3. Миграция базы данных (если нужно)
npm run db:push

# 4. Запуск production сервера
NODE_ENV=production npm start
```

## 📞 Поддержка

При проблемах проверьте:

1. **Логи сервера** - смотрите вывод консоли
2. **CORS блокировки** - ищите "Blocked by CORS" в логах
3. **Сессии** - проверьте что PostgreSQL работает
4. **Cookies** - убедитесь что `sameSite: 'lax'` и `secure: false`

---

*Документация обновлена: 19 ноября 2025*
