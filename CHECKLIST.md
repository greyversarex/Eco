# ✅ Контрольный список для развертывания на новом сервере

## Перед переносом (на Replit)

- [x] Все изменения сохранены
- [x] Сервер работает локально
- [x] База данных мигрирована
- [x] Документация создана

## Подготовка нового сервера

### 1. Системные требования

- [ ] Node.js 18+ установлен
  ```bash
  node --version  # должна быть >= 18
  ```

- [ ] PostgreSQL 13+ установлен
  ```bash
  psql --version  # должна быть >= 13
  ```

- [ ] NPM установлен
  ```bash
  npm --version  # должна быть >= 8
  ```

- [ ] Git установлен
  ```bash
  git --version
  ```

### 2. Настройка PostgreSQL

- [ ] PostgreSQL сервис запущен
  ```bash
  sudo systemctl status postgresql
  ```

- [ ] База данных создана
  ```bash
  sudo -u postgres psql
  CREATE DATABASE ecotajikistan;
  \q
  ```

- [ ] Пользователь создан (опционально)
  ```bash
  sudo -u postgres psql
  CREATE USER ecouser WITH PASSWORD 'ваш-пароль';
  GRANT ALL PRIVILEGES ON DATABASE ecotajikistan TO ecouser;
  \q
  ```

- [ ] Проверка подключения
  ```bash
  psql postgresql://ecouser:ваш-пароль@localhost:5432/ecotajikistan -c "SELECT 1"
  ```

### 3. Клонирование репозитория

- [ ] Репозиторий клонирован
  ```bash
  git clone <url-репозитория>
  cd ecotajikistan
  ```

- [ ] Все файлы на месте
  ```bash
  ls -la
  # Должны быть: package.json, README.md, DEPLOYMENT.md, .env.example
  ```

### 4. Установка зависимостей

- [ ] NPM пакеты установлены
  ```bash
  npm install
  # Подождите завершения (может занять 2-3 минуты)
  ```

- [ ] Проверка установки
  ```bash
  npm list --depth=0
  ```

### 5. Настройка окружения

- [ ] Файл .env создан
  ```bash
  cp .env.example .env
  ```

- [ ] DATABASE_URL настроен в .env
  ```env
  DATABASE_URL=postgresql://ecouser:ваш-пароль@localhost:5432/ecotajikistan
  ```

- [ ] SESSION_SECRET настроен (опционально)
  ```bash
  # Генерация секретного ключа
  openssl rand -base64 32
  # Скопируйте вывод в .env как SESSION_SECRET=...
  ```

- [ ] NODE_ENV установлен
  ```env
  NODE_ENV=production
  ```

### 6. Миграция базы данных

- [ ] Применены миграции
  ```bash
  npm run db:migrate
  ```

- [ ] Создан первый администратор и департаменты
  ```bash
  npm run db:seed
  ```

- [ ] Записаны учетные данные
  ```
  Администратор:
  - Логин: admin
  - Пароль: admin123
  
  Примеры кодов департаментов:
  - CENTRAL001 - Дастгоҳи марказӣ
  - DUSHANBE003 - Сарраёсати ш. Душанбе
  ```

### 7. Первый запуск

- [ ] Приложение запускается в dev режиме
  ```bash
  npm run dev
  ```

- [ ] Сайт доступен в браузере
  ```
  Откройте: http://localhost:5000
  ```

- [ ] Проверка входа администратора
  ```
  1. Откройте http://localhost:5000/admin
  2. Логин: admin
  3. Пароль: admin123
  ```

- [ ] Проверка входа департамента
  ```
  1. Откройте http://localhost:5000/
  2. Введите код: CENTRAL001
  ```

### 8. Production настройка (PM2)

- [ ] PM2 установлен глобально
  ```bash
  npm install -g pm2
  ```

- [ ] Приложение собрано для production
  ```bash
  npm run build
  ```

- [ ] PM2 запущен
  ```bash
  pm2 start npm --name "ecotajikistan" -- start
  ```

- [ ] PM2 автозапуск настроен
  ```bash
  pm2 save
  pm2 startup
  # Выполните команду которую покажет PM2
  ```

- [ ] Проверка статуса PM2
  ```bash
  pm2 status
  pm2 logs ecotajikistan
  ```

### 9. Nginx настройка (опционально)

- [ ] Nginx установлен
  ```bash
  sudo apt install nginx
  ```

- [ ] Конфигурация создана
  ```bash
  sudo nano /etc/nginx/sites-available/ecotajikistan
  # Скопируйте конфигурацию из DEPLOYMENT.md
  ```

- [ ] Конфигурация активирована
  ```bash
  sudo ln -s /etc/nginx/sites-available/ecotajikistan /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo systemctl reload nginx
  ```

- [ ] Сайт доступен через Nginx
  ```
  Откройте: http://ваш-домен.tj
  ```

### 10. SSL сертификат (опционально)

- [ ] Certbot установлен
  ```bash
  sudo apt install certbot python3-certbot-nginx
  ```

- [ ] SSL сертификат получен
  ```bash
  sudo certbot --nginx -d ваш-домен.tj -d www.ваш-домен.tj
  ```

- [ ] HTTPS работает
  ```
  Откройте: https://ваш-домен.tj
  ```

### 11. Firewall настройка

- [ ] UFW установлен
  ```bash
  sudo apt install ufw
  ```

- [ ] Порты открыты
  ```bash
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP
  sudo ufw allow 443/tcp   # HTTPS
  ```

- [ ] UFW включен
  ```bash
  sudo ufw enable
  sudo ufw status
  ```

### 12. Резервное копирование

- [ ] Директория для бэкапов создана
  ```bash
  sudo mkdir -p /home/backup/postgresql
  ```

- [ ] Скрипт бэкапа создан
  ```bash
  sudo nano /home/backup/backup-db.sh
  # Скопируйте скрипт из DEPLOYMENT.md
  sudo chmod +x /home/backup/backup-db.sh
  ```

- [ ] Cron задача настроена
  ```bash
  crontab -e
  # Добавьте: 0 2 * * * /home/backup/backup-db.sh
  ```

- [ ] Тестовый бэкап выполнен
  ```bash
  /home/backup/backup-db.sh
  ls -lh /home/backup/postgresql/
  ```

### 13. Финальные тесты

- [ ] Вход администратора работает
- [ ] Создание нового департамента работает
- [ ] Вход департамента работает
- [ ] Отправка сообщения работает
- [ ] Загрузка файла (до 100MB) работает
- [ ] Скачивание файла работает
- [ ] Просмотр входящих сообщений работает
- [ ] Просмотр исходящих сообщений работает

### 14. Мониторинг

- [ ] Логи PM2 проверены
  ```bash
  pm2 logs ecotajikistan --lines 50
  ```

- [ ] Логи PostgreSQL проверены
  ```bash
  sudo tail -f /var/log/postgresql/postgresql-*-main.log
  ```

- [ ] Логи Nginx проверены (если используется)
  ```bash
  sudo tail -f /var/log/nginx/access.log
  sudo tail -f /var/log/nginx/error.log
  ```

### 15. Безопасность

- [ ] Пароль администратора изменен
  ```
  Войдите как admin → Настройки → Изменить пароль
  ```

- [ ] SESSION_SECRET уникален
  ```bash
  # В .env должен быть уникальный ключ
  grep SESSION_SECRET .env
  ```

- [ ] PostgreSQL доступен только с localhost
  ```bash
  sudo nano /etc/postgresql/*/main/pg_hba.conf
  # Проверьте что нет строк с 0.0.0.0/0
  ```

- [ ] Firewall активен
  ```bash
  sudo ufw status
  ```

### 16. Документация

- [ ] Учетные данные сохранены в безопасном месте
- [ ] Инструкции для пользователей подготовлены
- [ ] Контакты для поддержки указаны

## Готово! 🎉

Если все пункты отмечены, система полностью развернута и готова к использованию!

### Полезные команды

```bash
# Просмотр логов
pm2 logs ecotajikistan

# Перезапуск приложения
pm2 restart ecotajikistan

# Просмотр статуса
pm2 status

# Обновление приложения
git pull origin main
npm install
npm run db:migrate
pm2 restart ecotajikistan

# Резервное копирование БД
pg_dump ecotajikistan > backup_$(date +%Y%m%d).sql

# Восстановление БД
psql ecotajikistan < backup_20251022.sql
```

### Куда обратиться при проблемах

1. Проверьте логи: `pm2 logs ecotajikistan`
2. Проверьте статус: `pm2 status`
3. Проверьте БД: `psql $DATABASE_URL -c "SELECT 1"`
4. Проверьте порты: `sudo lsof -i :5000`
5. Смотрите DEPLOYMENT.md раздел "Устранение неполадок"
