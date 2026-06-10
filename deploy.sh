#!/bin/bash
set -e

echo "=== Обновление кода ==="
# npm install на сервере перегенерирует package-lock.json, и его локальные
# изменения блокируют git pull. Сбрасываем только этот файл (версия из репозитория
# авторитетна), чтобы pull всегда проходил чисто.
git checkout -- package-lock.json 2>/dev/null || true
git pull origin main

echo "=== Установка зависимостей ==="
# package-lock.json генерируется на Replit и содержит внутренние URL
# (package-firewall.replit.local), недоступные с внешнего сервера. Удаляем его
# и ставим зависимости напрямую с публичного реестра npm.
rm -f package-lock.json
npm install --registry=https://registry.npmjs.org/

echo "=== Сборка проекта ==="
NODE_OPTIONS="--max-old-space-size=4096" npm run build

echo "=== Обновление базы данных ==="
npm run db:push

echo "=== Перезапуск сервера ==="
pm2 restart all

echo "=== Деплой завершён успешно ==="
