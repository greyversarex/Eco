#!/bin/bash
set -e

echo "=== Обновление кода ==="
git pull origin main

echo "=== Установка зависимостей ==="
npm install

echo "=== Сборка проекта ==="
NODE_OPTIONS="--max-old-space-size=4096" npm run build

echo "=== Обновление базы данных ==="
npm run db:push

echo "=== Перезапуск сервера ==="
pm2 restart all

echo "=== Деплой завершён успешно ==="
