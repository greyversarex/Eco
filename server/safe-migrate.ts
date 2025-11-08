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

    // Добавляем recipient_ids в assignments (если еще нет)
    console.log('Проверка поля recipient_ids в таблице assignments...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'assignments' AND column_name = 'recipient_ids'
        ) THEN
          ALTER TABLE assignments ADD COLUMN recipient_ids integer[] NOT NULL DEFAULT ARRAY[]::integer[];
          RAISE NOTICE 'Колонка recipient_ids добавлена в assignments';
        ELSE
          RAISE NOTICE 'Колонка recipient_ids уже существует в assignments';
        END IF;
      END $$;
    `);

    // Добавляем can_monitor в departments (если еще нет)
    console.log('Проверка поля can_monitor в таблице departments...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'departments' AND column_name = 'can_monitor'
        ) THEN
          ALTER TABLE departments ADD COLUMN can_monitor boolean NOT NULL DEFAULT false;
          RAISE NOTICE 'Колонка can_monitor добавлена в departments';
        ELSE
          RAISE NOTICE 'Колонка can_monitor уже существует в departments';
        END IF;
      END $$;
    `);

    // Добавляем can_create_assignment_from_message в departments (если еще нет)
    console.log('Проверка поля can_create_assignment_from_message в таблице departments...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'departments' AND column_name = 'can_create_assignment_from_message'
        ) THEN
          ALTER TABLE departments ADD COLUMN can_create_assignment_from_message boolean NOT NULL DEFAULT false;
          RAISE NOTICE 'Колонка can_create_assignment_from_message добавлена в departments';
        ELSE
          RAISE NOTICE 'Колонка can_create_assignment_from_message уже существует в departments';
        END IF;
      END $$;
    `);

    // Добавляем can_create_assignment в departments (если еще нет)
    console.log('Проверка поля can_create_assignment в таблице departments...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'departments' AND column_name = 'can_create_assignment'
        ) THEN
          ALTER TABLE departments ADD COLUMN can_create_assignment boolean NOT NULL DEFAULT false;
          RAISE NOTICE 'Колонка can_create_assignment добавлена в departments';
        ELSE
          RAISE NOTICE 'Колонка can_create_assignment уже существует в departments';
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

    // Создаем таблицу people (если еще нет)
    console.log('Проверка таблицы people...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS people (
        id SERIAL PRIMARY KEY,
        name text NOT NULL,
        department_id integer NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        created_at timestamp NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ Таблица people проверена');

    // Создаем индекс для department_id в people (если еще нет)
    console.log('Проверка индекса people_department_id_idx...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS people_department_id_idx ON people(department_id);
    `);
    console.log('✓ Индекс people_department_id_idx проверен');

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
