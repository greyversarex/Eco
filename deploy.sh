#!/bin/bash
set -e

echo "=== Обновление кода ==="
# npm install на сервере перегенерирует package-lock.json, и его локальные
# изменения блокируют git pull. Сбрасываем только этот файл (версия из репозитория
# авторитетна), чтобы pull всегда проходил чисто.
git checkout -- package-lock.json 2>/dev/null || true
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
