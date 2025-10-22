# 🚀 Руководство по развертыванию ЭкоТочикистон

## Системные требования

- **Node.js**: версия 18.x или выше
- **PostgreSQL**: версия 13.x или выше
- **NPM**: версия 8.x или выше
- **Операционная система**: Linux (Ubuntu/Debian рекомендуется), macOS, или Windows

## Подготовка базы данных

### 1. Установите PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
```

### 2. Создайте базу данных

```bash
# Войдите в PostgreSQL
sudo -u postgres psql

# Создайте базу данных
CREATE DATABASE ecotajikistan;

# Создайте пользователя (опционально)
CREATE USER ecouser WITH PASSWORD 'your-secure-password';

# Дайте права пользователю
GRANT ALL PRIVILEGES ON DATABASE ecotajikistan TO ecouser;

# Выйдите
\q
```

## Установка приложения

### Шаг 1: Клонируйте репозиторий

```bash
git clone <url-вашего-репозитория>
cd ecotajikistan
```

### Шаг 2: Установите зависимости

```bash
npm install
```

### Шаг 3: Настройте переменные окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Отредактируйте `.env` и установите правильные значения:

```env
# Обязательно: укажите строку подключения к вашей БД
DATABASE_URL=postgresql://ecouser:your-secure-password@localhost:5432/ecotajikistan

# Опционально: сгенерируйте секретный ключ
SESSION_SECRET=$(openssl rand -base64 32)

# Для production
NODE_ENV=production
```

### Шаг 4: Примените миграции базы данных

```bash
npm run db:push
```

Если возникнут предупреждения о потере данных (при первой установке их не будет):

```bash
npm run db:push -- --force
```

### Шаг 5: Создайте первого администратора

Запустите приложение в режиме разработки:

```bash
npm run dev
```

Откройте браузер: `http://localhost:5000`

Перейдите на `/admin/setup` и создайте первого администратора.

## Запуск в production

### Вариант 1: Прямой запуск через npm

```bash
# Установите NODE_ENV=production
export NODE_ENV=production

# Запустите приложение
npm start
```

### Вариант 2: Использование PM2 (рекомендуется)

PM2 - менеджер процессов Node.js, который обеспечивает автоматический перезапуск при сбоях.

```bash
# Установите PM2 глобально
npm install -g pm2

# Запустите приложение через PM2
pm2 start npm --name "ecotajikistan" -- start

# Сохраните конфигурацию PM2 для автозапуска
pm2 save
pm2 startup

# Просмотр логов
pm2 logs ecotajikistan

# Остановка
pm2 stop ecotajikistan

# Перезапуск
pm2 restart ecotajikistan
```

### Вариант 3: Systemd Service (Linux)

Создайте файл службы `/etc/systemd/system/ecotajikistan.service`:

```ini
[Unit]
Description=EcoTajikistan Application
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/ecotajikistan
Environment="NODE_ENV=production"
Environment="DATABASE_URL=postgresql://user:password@localhost:5432/ecotajikistan"
Environment="SESSION_SECRET=your-secret-key"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Включите и запустите службу:

```bash
sudo systemctl enable ecotajikistan
sudo systemctl start ecotajikistan
sudo systemctl status ecotajikistan
```

## Настройка Nginx (рекомендуется)

Для production рекомендуется использовать Nginx в качестве reverse proxy.

### Установите Nginx

```bash
sudo apt install nginx
```

### Создайте конфигурацию сайта

Файл `/etc/nginx/sites-available/ecotajikistan`:

```nginx
server {
    listen 80;
    server_name your-domain.tj www.your-domain.tj;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/ecotajikistan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL/HTTPS с Let's Encrypt

```bash
# Установите Certbot
sudo apt install certbot python3-certbot-nginx

# Получите SSL сертификат
sudo certbot --nginx -d your-domain.tj -d www.your-domain.tj

# Автообновление сертификата
sudo certbot renew --dry-run
```

## Резервное копирование

### Автоматическое резервное копирование базы данных

Создайте скрипт `/home/backup/backup-db.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/backup/postgresql"
DB_NAME="ecotajikistan"

mkdir -p $BACKUP_DIR

pg_dump $DB_NAME > "$BACKUP_DIR/backup_$DATE.sql"

# Удалить старые бэкапы (старше 7 дней)
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Добавьте в crontab:

```bash
crontab -e

# Добавьте строку (бэкап каждый день в 2:00)
0 2 * * * /home/backup/backup-db.sh
```

## Восстановление из резервной копии

```bash
# Восстановление из SQL файла
psql ecotajikistan < /home/backup/postgresql/backup_YYYYMMDD_HHMMSS.sql
```

## Мониторинг и логи

### Просмотр логов приложения

**PM2:**
```bash
pm2 logs ecotajikistan
pm2 logs ecotajikistan --lines 100
```

**Systemd:**
```bash
sudo journalctl -u ecotajikistan -f
```

### Просмотр логов Nginx

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Обновление приложения

```bash
# Остановите приложение
pm2 stop ecotajikistan
# или
sudo systemctl stop ecotajikistan

# Получите последние изменения
git pull origin main

# Установите новые зависимости (если есть)
npm install

# Примените миграции БД (если есть)
npm run db:push

# Запустите приложение
pm2 restart ecotajikistan
# или
sudo systemctl start ecotajikistan
```

## Устранение неполадок

### Проблема: Приложение не запускается

```bash
# Проверьте логи
pm2 logs ecotajikistan --err

# Проверьте переменные окружения
printenv | grep DATABASE_URL

# Проверьте подключение к БД
psql $DATABASE_URL -c "SELECT 1"
```

### Проблема: Не загружаются файлы

```bash
# Проверьте лимиты Nginx
sudo nano /etc/nginx/sites-available/ecotajikistan
# Убедитесь что client_max_body_size >= 100M
```

### Проблема: Порт 5000 занят

```bash
# Найдите процесс
sudo lsof -i :5000

# Остановите процесс
sudo kill -9 <PID>
```

## Безопасность

1. **Всегда используйте HTTPS** в production
2. **Регулярно обновляйте** зависимости: `npm audit fix`
3. **Настройте firewall**:
   ```bash
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw enable
   ```
4. **Ограничьте доступ к PostgreSQL** только с localhost
5. **Регулярно делайте резервные копии БД**
6. **Используйте сильные пароли** для БД и SESSION_SECRET

## Поддержка

При возникновении проблем проверьте:
- Логи приложения
- Логи PostgreSQL: `/var/log/postgresql/`
- Логи Nginx: `/var/log/nginx/`
- Статус служб: `systemctl status ecotajikistan postgresql nginx`

## Контрольный список развертывания

- [ ] PostgreSQL установлен и настроен
- [ ] База данных создана
- [ ] Репозиторий клонирован
- [ ] Зависимости установлены (`npm install`)
- [ ] Файл `.env` настроен с правильными значениями
- [ ] Миграции применены (`npm run db:push`)
- [ ] Первый администратор создан
- [ ] PM2 или systemd настроен
- [ ] Nginx настроен (для production)
- [ ] SSL сертификат установлен (для production)
- [ ] Резервное копирование настроено
- [ ] Firewall настроен
- [ ] Приложение доступно через браузер
- [ ] Тестирование: логин, отправка сообщений, загрузка файлов

---

**Готово!** Ваше приложение ЭкоТочикистон теперь работает на production сервере.
