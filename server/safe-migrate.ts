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

    // Добавляем sort_order в departments (если еще нет)
    console.log('Проверка поля sort_order в таблице departments...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'departments' AND column_name = 'sort_order'
        ) THEN
          ALTER TABLE departments ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
          RAISE NOTICE 'Колонка sort_order добавлена в departments';
        ELSE
          RAISE NOTICE 'Колонка sort_order уже существует в departments';
        END IF;
      END $$;
    `);

    // Добавляем can_create_announcement в departments (если еще нет)
    console.log('Проверка поля can_create_announcement в таблице departments...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'departments' AND column_name = 'can_create_announcement'
        ) THEN
          ALTER TABLE departments ADD COLUMN can_create_announcement boolean NOT NULL DEFAULT false;
          RAISE NOTICE 'Колонка can_create_announcement добавлена в departments';
        ELSE
          RAISE NOTICE 'Колонка can_create_announcement уже существует в departments';
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

    // Добавляем executor_ids в assignments (если еще нет)
    console.log('Проверка поля executor_ids в таблице assignments...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'assignments' AND column_name = 'executor_ids'
        ) THEN
          ALTER TABLE assignments ADD COLUMN executor_ids integer[] NOT NULL DEFAULT ARRAY[]::integer[];
          RAISE NOTICE 'Колонка executor_ids добавлена в assignments';
        ELSE
          RAISE NOTICE 'Колонка executor_ids уже существует в assignments';
        END IF;
      END $$;
    `);
    console.log('✓ Поле executor_ids проверено');

    // Добавляем начальных исполнителей в таблицу people (если таблица пустая)
    console.log('Проверка исполнителей в таблице people...');
    const existingPeopleCount = await db.execute(sql`SELECT COUNT(*) FROM people`);
    const count = parseInt(existingPeopleCount.rows[0].count as string);
    
    if (count === 0) {
      console.log('Таблица people пустая, добавляем исполнителей...');
      
      // Получаем ID департамента "Роҳбарият" (первый департамент с кодом ROHBAR001)
      const rohbariyatResult = await db.execute(sql`SELECT id FROM departments WHERE access_code = 'ROHBAR001' LIMIT 1`);
      const rohbariyatId = rohbariyatResult.rows[0]?.id;
      
      if (rohbariyatId) {
        const executors = [
          'Шукурзода И',
          'Раҳмонзода Л.Ш',
          'Назирзода Абдуқодир. С',
          'Қурбонзода Абдуллоҳ. Ҳ',
          'Холзода Суҳроб. Хол',
          'Сабзали Шаҳтут. Н',
          'Собтрзода Қурбоналӣ. М',
          'Нурализода Фируз. М',
          'Сафарализода Бахтиёр. С',
          'Ибодуллои Маҳмадулло',
          'Салимзода Умаралӣ. С',
          'Қаландарзода Абдуқаюм. Ҷ',
          'Давлатзода Сарвар',
          'Зарифзода Фарҳод. Т',
          'Идизод Неъматулло. Р',
          'Қурбонзода Фируз. А',
          'Маҳмудов Насим. З',
          'Раҳмоналӣ Маҳмадалӣ',
          'Давлатзода Афзал. А',
          'Бобохонзода Адолатхон. О',
          'Шамсиддинзода Хуршед.Ш',
          'Дустзода Ҳасан. Т',
          'Шерматов Хисравшоҳ. Р',
          'Сафаров Фирузю П',
          'Улуғов Умидҷон. А',
          'Тиллои Гулрухсор. А',
          'Аҳрорзода Ҳамароҳ. Ҳ',
          'Судурзода Саидисмон. С',
          'Ятимов Олимҷон. Р',
          'Ҷунайдзода Муҳибулло.Ҳ',
          'Панҷиев Аъзам. А',
          'Яқубов Ҷамолиддин. Н',
          'Каримов Алихон. А',
          'Алмосов Сафаралӣ. А',
          'Ашуриён Хуршед. Қ',
          'Юсуфзода Абдуҷалил.Ҳ',
          'Маҳмадализода Шарофиддин. А',
          'Камолзода Дилшод. Н',
          'Каримзода Акмал. Т',
          'Нуров Муродулло.Т',
          'Расуло Ҷамшед. Д',
          'Буев Абдулазиз. А',
          'Камолов Эраҷ. Т',
          'Раҷабов Сайҷафар. Д',
          'Саъдуллоев Бекназар. С',
          'Ҳуҷумбороа Фазлиддин. С',
        ];

        for (const executor of executors) {
          await db.execute(sql`
            INSERT INTO people (name, department_id, created_at)
            VALUES (${executor}, ${rohbariyatId}, NOW())
          `);
        }
        
        console.log(`✓ Добавлено ${executors.length} исполнителей в департамент "Роҳбарият"`);
      } else {
        console.log('⚠ Департамент "Роҳбарият" не найден, исполнители не добавлены');
      }
    } else {
      console.log(`✓ В таблице people уже есть ${count} записей`);
    }

    // Миграция для broadcast messages - добавление recipient_ids массива
    console.log('Миграция broadcast messages: добавление recipient_ids...');
    await db.execute(sql`
      DO $$
      BEGIN
        -- Добавляем recipient_ids column если не существует
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'messages' AND column_name = 'recipient_ids'
        ) THEN
          ALTER TABLE messages ADD COLUMN recipient_ids integer[] NOT NULL DEFAULT ARRAY[]::integer[];
          RAISE NOTICE 'Колонка recipient_ids добавлена в messages';
          
          -- Backfill: копируем recipient_id в recipient_ids для существующих записей
          UPDATE messages 
          SET recipient_ids = ARRAY[recipient_id] 
          WHERE recipient_id IS NOT NULL AND recipient_ids = ARRAY[]::integer[];
          RAISE NOTICE 'Существующие recipient_id скопированы в recipient_ids';
          
          -- Делаем recipient_id nullable для обратной совместимости
          ALTER TABLE messages ALTER COLUMN recipient_id DROP NOT NULL;
          RAISE NOTICE 'Колонка recipient_id теперь nullable';
        ELSE
          RAISE NOTICE 'Колонка recipient_ids уже существует в messages';
        END IF;
        
        -- Создаем GIN индекс для эффективных запросов массива
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE tablename = 'messages' AND indexname = 'messages_recipient_ids_idx'
        ) THEN
          CREATE INDEX messages_recipient_ids_idx ON messages USING gin(recipient_ids);
          RAISE NOTICE 'GIN индекс messages_recipient_ids_idx создан';
        ELSE
          RAISE NOTICE 'GIN индекс messages_recipient_ids_idx уже существует';
        END IF;
      END $$;
    `);
    console.log('✓ Миграция broadcast messages завершена');

    // Добавляем icon в departments (если еще нет) - оставляем для обратной совместимости
    console.log('Проверка поля icon в таблице departments...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'departments' AND column_name = 'icon'
        ) THEN
          ALTER TABLE departments ADD COLUMN icon text NOT NULL DEFAULT 'building-2';
          RAISE NOTICE 'Колонка icon добавлена в departments';
        ELSE
          RAISE NOTICE 'Колонка icon уже существует в departments';
          
          -- Ensure existing icon column is NOT NULL
          ALTER TABLE departments ALTER COLUMN icon SET DEFAULT 'building-2';
          UPDATE departments SET icon = 'building-2' WHERE icon IS NULL;
          ALTER TABLE departments ALTER COLUMN icon SET NOT NULL;
          RAISE NOTICE 'Колонка icon обновлена: NOT NULL constraint установлен';
        END IF;
      END $$;
    `);
    console.log('✓ Поле icon проверено');

    // Создаем таблицу department_icons для загрузки изображений
    console.log('Проверка таблицы department_icons...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'department_icons'
        ) THEN
          CREATE TABLE department_icons (
            id serial PRIMARY KEY,
            department_id integer NOT NULL UNIQUE REFERENCES departments(id) ON DELETE CASCADE,
            file_name text NOT NULL,
            file_data bytea NOT NULL,
            file_size integer NOT NULL,
            mime_type text NOT NULL,
            updated_at timestamp DEFAULT now() NOT NULL
          );
          CREATE INDEX department_icons_department_id_idx ON department_icons(department_id);
          RAISE NOTICE 'Таблица department_icons создана';
        ELSE
          RAISE NOTICE 'Таблица department_icons уже существует';
        END IF;
      END $$;
    `);
    console.log('✓ Таблица department_icons проверена');

    // Добавляем is_deleted в messages (для функции Корзина/Trash)
    console.log('Проверка поля is_deleted в таблице messages...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'messages' AND column_name = 'is_deleted'
        ) THEN
          ALTER TABLE messages ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;
          RAISE NOTICE 'Колонка is_deleted добавлена в messages';
        ELSE
          RAISE NOTICE 'Колонка is_deleted уже существует в messages';
        END IF;
      END $$;
    `);
    console.log('✓ Поле is_deleted в messages проверено');

    // Создаем индекс для is_deleted в messages
    console.log('Проверка индекса messages_is_deleted_idx...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS messages_is_deleted_idx ON messages(is_deleted);
    `);
    console.log('✓ Индекс messages_is_deleted_idx проверен');

    // Добавляем is_deleted в assignments (для функции Корзина/Trash)
    console.log('Проверка поля is_deleted в таблице assignments...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'assignments' AND column_name = 'is_deleted'
        ) THEN
          ALTER TABLE assignments ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;
          RAISE NOTICE 'Колонка is_deleted добавлена в assignments';
        ELSE
          RAISE NOTICE 'Колонка is_deleted уже существует в assignments';
        END IF;
      END $$;
    `);
    console.log('✓ Поле is_deleted в assignments проверено');

    // Создаем индекс для is_deleted в assignments
    console.log('Проверка индекса assignments_is_deleted_idx...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS assignments_is_deleted_idx ON assignments(is_deleted);
    `);
    console.log('✓ Индекс assignments_is_deleted_idx проверен');

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
