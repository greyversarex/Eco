# Исправление ошибки 401 для Push Notifications на Production

## Проблема

При попытке подписаться на уведомления на production сервере, запрос `POST /api/push/subscribe` возвращает ошибку **401 Unauthorized**.

## Причина

Frontend корректно отправляет `credentials: 'include'` (проверено в `client/src/hooks/usePushNotifications.ts`), но на production сервере CORS блокирует запросы из-за неправильной настройки переменной `ALLOWED_ORIGINS`.

## Решение

### 1. Проверьте текущие настройки ALLOWED_ORIGINS

На production сервере (176.98.176.158) проверьте файл с переменными окружения:

```bash
ssh root@176.98.176.158
cat /root/ecodoc/.env | grep ALLOWED_ORIGINS
```

### 2. Настройте ALLOWED_ORIGINS правильно

Отредактируйте файл `.env` на сервере:

```bash
nano /root/ecodoc/.env
```

Добавьте или исправьте строку `ALLOWED_ORIGINS`:

```env
# Для HTTP доступа по IP
ALLOWED_ORIGINS=http://176.98.176.158:5000

# Если используется доменное имя с HTTPS
ALLOWED_ORIGINS=https://ecodoc.example.com

# Если нужны оба варианта (через запятую)
ALLOWED_ORIGINS=http://176.98.176.158:5000,https://ecodoc.example.com

# Для мобильных приложений (Capacitor) добавьте:
ALLOWED_ORIGINS=http://176.98.176.158:5000,capacitor://localhost,https://localhost
```

### 3. Перезапустите сервер

После изменения `.env` файла:

```bash
pm2 restart ecodoc
```

Или если используется systemd:

```bash
systemctl restart ecodoc
```

### 4. Проверьте логи

Проверьте что CORS больше не блокирует запросы:

```bash
pm2 logs ecodoc --lines 50
```

Если видите строки `Blocked by CORS: http://...`, значит origin не добавлен в `ALLOWED_ORIGINS`.

## Почему это происходит?

В `server/index.ts` настроен CORS с проверкой origin:

```typescript
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
    
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else if (!isProduction) {
      callback(null, true); // В development разрешено всё
    } else {
      console.log('Blocked by CORS:', origin); // ← Проверьте логи!
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // ← Это правильно!
  exposedHeaders: ['set-cookie'],
}));
```

**В production режиме** сервер строго проверяет origin и блокирует запросы с `credentials` если origin не в списке `ALLOWED_ORIGINS`.

## Важно!

### Для PWA/Mobile приложений

Если вы используете PWA или нативные мобильные приложения, обязательно добавьте специальные origins:

```env
ALLOWED_ORIGINS=http://176.98.176.158:5000,capacitor://localhost,https://localhost
```

### Для HTTPS (рекомендуется для production)

Если у вас настроен HTTPS через Nginx:

```env
ALLOWED_ORIGINS=https://ecodoc.example.com
```

И убедитесь что в Nginx настроен правильный proxy:

```nginx
location /api/ {
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Проверка

После исправления попробуйте подписаться на уведомления через браузер на production сервере. Вы должны увидеть в логах:

```
POST /api/push/subscribe 200 in XXms
```

Вместо:

```
POST /api/push/subscribe 401 in Xms
```

## Дополнительная диагностика

Если проблема сохраняется, проверьте:

1. **Session cookie работает:**
   ```bash
   curl -v -c cookies.txt http://176.98.176.158:5000/api/auth/me
   ```

2. **Credentials передаются:**
   Откройте DevTools → Network → найдите запрос `/api/push/subscribe` → проверьте Headers → должен быть `Cookie: connect.sid=...`

3. **CORS headers правильные:**
   В Response Headers должно быть:
   - `Access-Control-Allow-Origin: http://176.98.176.158:5000` (ваш origin)
   - `Access-Control-Allow-Credentials: true`

---

**Статус**: После исправления `ALLOWED_ORIGINS` проблема будет решена ✅
