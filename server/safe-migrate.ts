/**
 * Безопасная миграция для продакшена
 * Добавляет только новые колонки, НЕ удаляет существующие данные
 */
import 'dotenv/config';
import { db } from './db';
import { sql } from 'drizzle-orm';

async function safeMigrate() {
  console.log('🔄 Запуск безопасной миграции...\n');

  try {
    // Добавляем document_number в messages (если еще нет)
    console.log('Проверка поля document_number в таблице messages...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'messages' AND column_name = 'document_number'
        ) THEN
          ALTER TABLE messages ADD COLUMN document_number text;
          RAISE NOTICE 'Колонка document_number добавлена в messages';
        ELSE
          RAISE NOTICE 'Колонка document_number уже существует в messages';
        END IF;
      END $$;
    `);

    // Добавляем document_number в assignments (если еще нет)
    console.log('Проверка поля document_number в таблице assignments...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'assignments' AND column_name = 'document_number'
        ) THEN
          ALTER TABLE assignments ADD COLUMN document_number text;
          RAISE NOTICE 'Колонка document_number добавлена в assignments';
        ELSE
          RAISE NOTICE 'Колонка document_number уже существует в assignments';
        END IF;
      END $$;
    `);

    // Добавляем content в assignments (если еще нет)
    console.log('Проверка поля content в таблице assignments...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'assignments' AND column_name = 'content'
        ) THEN
          ALTER TABLE assignments ADD COLUMN content text;
          RAISE NOTICE 'Колонка content добавлена в assignments';
        ELSE
          RAISE NOTICE 'Колонка content уже существует в assignments';
        END IF;
      END $$;
    `);

    // Создаем таблицу sessions (если еще нет)
    console.log('Проверка таблицы sessions...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        sid text PRIMARY KEY NOT NULL,
        sess text NOT NULL,
        expire timestamp NOT NULL
      );
    `);
    console.log('✓ Таблица sessions проверена');

    console.log('\n✅ Миграция завершена успешно!');
    console.log('Все данные сохранены, новые поля добавлены.');
  } catch (error: any) {
    console.error('❌ Ошибка миграции:', error.message);
    throw error;
  }
}

safeMigrate()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Миграция не выполнена:', error);
    process.exit(1);
  });
