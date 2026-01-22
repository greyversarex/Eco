import 'dotenv/config';
import { db } from './db';
import { departments, admins, people } from '../shared/schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Seeding database...');

  try {
    // Check if admin already exists
    const existingAdmin = await db.select().from(admins).where(eq(admins.username, 'admin'));
    
    if (existingAdmin.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.insert(admins).values({
        username: 'admin',
        password: hashedPassword,
      });
      console.log('✓ Admin user created (username: admin, password: admin123)');
    } else {
      console.log('✓ Admin user already exists');
    }

    // Real departments data from Ministry of Environmental Protection
    // Блоки: upper = "Кумитаи ҳифзи муҳити зист", middle = "Раёсатҳо", lower = "Муссисаҳои тиҷоратӣ, ғайритиҷоратӣ ва Марказҳо", district = "Ноҳияҳои тобеи марказ"
    const departmentData = [
      // Блок: Кумитаи ҳифзи муҳити зист (Upper Block)
      { name: 'Роҳбарият', block: 'upper', accessCode: 'ROHBAR001' },
      { name: 'Муовини Якум', block: 'upper', accessCode: 'MUOVIN001' },
      { name: 'Муовин', block: 'upper', accessCode: 'LOIQ001' },
      { name: 'Шуъбаи умумӣ', block: 'upper', accessCode: 'UMUMI001' },
      { name: 'Сарраёсати ш. Душанбе', block: 'upper', accessCode: 'DUSHANBE001' },
      { name: 'Агентии обуҳавошиносӣ', block: 'upper', accessCode: 'AGENTI001' },
      { name: 'Сарраёсати Вилояти Суғд', block: 'upper', accessCode: 'SUGHD001' },
      { name: 'Сарраёсати ВМКБ', block: 'upper', accessCode: 'VMKB001' },
      
      // Блок: Раёсатҳо (Middle Block)
      { name: 'Раёсати экспертизаи давлатии экологӣ', block: 'middle', accessCode: 'ECOLOGI001' },
      { name: 'Раёсати мониторинг, сиёсати экологӣ, обуҳавошиносӣ ва кадастр', block: 'middle', accessCode: 'MONITORING001' },
      { name: 'Раёсати кадрҳо, коргузорӣ ва назорат', block: 'middle', accessCode: 'KADR001' },
      { name: 'Раёсати назорати давлатии истифода ва ҳифзи ҳавои атмосфера', block: 'middle', accessCode: 'ATMOSFERA001' },
      { name: 'Раёсати рақамикунонӣ ва инноватсия', block: 'middle', accessCode: 'DIGITAL001' },
      { name: 'Раёсати назорати давлатии истифода ва ҳифзи олами набототу ҳайвонот ва захираҳои моҳӣ', block: 'middle', accessCode: 'MOHI001' },
      { name: 'Раёсати банақшагирӣ, муҳосибот ва молия', block: 'middle', accessCode: 'FINANCE001' },
      { name: 'Раёсати робитаҳои байналмилалӣ ва кор бо конвенсияҳои экологӣ', block: 'middle', accessCode: 'INTERNATIONAL001' },
      { name: 'Бахши таъминоти ҳуқуқӣ', block: 'middle', accessCode: 'HUQUQI001' },
      { name: 'Раёсати назорати давлатии истифода ва ҳифзи замин, канданиҳои фоиданоки маъмули ва муомилот бо партовҳо', block: 'middle', accessCode: 'PARTOVHO001' },
      { name: 'Раёсати назорати давлатии истифода ва ҳифзи захираҳои об', block: 'middle', accessCode: 'WATER001' },
      { name: 'Бахши ҳудудҳои табии махсус муҳофизатшаванда', block: 'middle', accessCode: 'PROTECTED021' },
      
      // Блок: Муссисаҳои тиҷоратӣ, ғайритиҷоратӣ ва Марказҳо (Lower Block)
      { name: 'Муассисаи давлатии "Ҳудудҳои табиии махсус муҳофизатшаванда"', block: 'lower', accessCode: 'NATURE022' },
      { name: 'Муассисаи давлатии "Лабораторияи илмию тадқиқотии ҳифзи табиат"', block: 'lower', accessCode: 'TABIAT001' },
      { name: 'Муассисаи давлатии "Маркази илмию тадқиқотии ҳифзи захираҳои об"', block: 'lower', accessCode: 'WATERRES024' },
      { name: 'Муассисаи давлатии "Маркази миллии амал оид ба ҳифзи муҳити зист"', block: 'lower', accessCode: 'ZIST001' },
      { name: 'Муассисаи давлатии "Маркази миллии иҷрои Конвенсияи Стокголм оид ба ифлоскунандаҳои устувори органикӣ"', block: 'lower', accessCode: 'STOCKHOLM001' },
      { name: 'Маркази ахбори экологӣ, тарғибот ва барномасозии компютерӣ', block: 'lower', accessCode: 'AHBOR001' },
      { name: 'Маркази назоратию таҳлилию ташхисӣ', block: 'lower', accessCode: 'TASHHISI001' },
      { name: 'Маркази стандартикунонӣ, методология ва меъёрҳои экологӣ', block: 'lower', accessCode: 'STANDARD001' },
      { name: 'Маркази миллии гуногунии биологӣ ва бехатарии биологӣ', block: 'lower', accessCode: 'BIOLOGI001' },
      { name: 'Маркази миллии ҳифзи қабати озон', block: 'lower', accessCode: 'OZON001' },
      { name: 'Маркази татбиқи лоиҳаҳои сармоягузорӣ', block: 'lower', accessCode: 'SARMOYA001' },
      { name: 'Шуъбаи корҳои сохтмону таъмир', block: 'lower', accessCode: 'TAMIR001' },
      { name: 'Рӯзномаи "Инсон ва табиат"', block: 'lower', accessCode: 'INSON001' },
      { name: 'Маҷаллаи "Ҳифзи табиат"', block: 'lower', accessCode: 'HIFZITABIAT001' },
      { name: 'Корхонаи воҳиди давлатии илмию истеҳсолии "Табиат"', block: 'lower', accessCode: 'ILMTABIAT001' },
      { name: 'Корхонаи воҳиди давлатии "Сайду сайёҳат"', block: 'lower', accessCode: 'SAYOHAT001' },
      
      // Блок: Ноҳияҳои тобеи марказ (Districts Under Central Administration)
      { name: 'Шуъбаи ҲМЗ дар ноҳияи Варзоб', block: 'district', accessCode: 'VARZOB001' },
      { name: 'Шуъбаи ҲМЗ дар ноҳияи Рудакӣ', block: 'district', accessCode: 'RUDAKI001' },
      { name: 'Шуъбаи ҲМЗ дар шаҳри Ҳисор', block: 'district', accessCode: 'HISOR001' },
      { name: 'Шуъбаи ҲМЗ дар ноҳияи Шаҳринав', block: 'district', accessCode: 'SHAHRINAV001' },
      { name: 'Шуъбаи ҲМЗ дар шаҳри Турсунзода', block: 'district', accessCode: 'TURSUNZODA001' },
      { name: 'Шуъбаи ҲМЗ дар шаҳри Ваҳдат', block: 'district', accessCode: 'VAHDAT001' },
      { name: 'Шуъбаи ҲМЗ дар ноҳияи Файзобод', block: 'district', accessCode: 'FAYZOBOD001' },
      { name: 'Шуъбаи ҲМЗ дар ноҳияи Рашт', block: 'district', accessCode: 'RASHT001' },
      { name: 'Бахши ҲМЗ дар шаҳри Роғун', block: 'district', accessCode: 'ROGUN001' },
      { name: 'Бахши ҲМЗ дар ноҳияи Лахш', block: 'district', accessCode: 'LAKHSH001' },
      { name: 'Бахши ҲМЗ дар ноҳияи Сангвор', block: 'district', accessCode: 'SANGVOR001' },
      { name: 'Бахши ҲМЗ дар ноҳияи Нуробод', block: 'district', accessCode: 'NUROBOD001' },
      { name: 'Бахши ҲМЗ дар ноҳияи Тоҷикобод', block: 'district', accessCode: 'TOJIKOBOD001' },
    ];

    // Check and insert departments
    for (const dept of departmentData) {
      const existing = await db.select().from(departments).where(eq(departments.accessCode, dept.accessCode));
      
      if (existing.length === 0) {
        await db.insert(departments).values(dept);
        console.log(`✓ Department created: ${dept.name} (code: ${dept.accessCode})`);
      } else {
        console.log(`✓ Department already exists: ${dept.name}`);
      }
    }

    // Real executors list distributed across departments
    const peopleData = [
      { name: 'Шукурзода И', deptCode: 'ROHBAR001' },
      { name: 'Раҳмонзода Л.Ш', deptCode: 'MUOVIN001' },
      { name: 'Назирзода Абдуқодир. С', deptCode: 'LOIQ001' },
      { name: 'Қурбонзода Абдуллоҳ. Ҳ', deptCode: 'UMUMI001' },
      { name: 'Холзода Суҳроб. Хол', deptCode: 'DUSHANBE001' },
      { name: 'Сабзали Шаҳтут. Н', deptCode: 'AGENTI001' },
      { name: 'Собтрзода Қурбоналӣ. М', deptCode: 'SUGHD001' },
      { name: 'Нурализода Фируз. М', deptCode: 'VMKB001' },
      { name: 'Сафарализода Бахтиёр. С', deptCode: 'ECOLOGI001' },
      { name: 'Ибодуллои Маҳмадулло', deptCode: 'MONITORING001' },
      { name: 'Салимзода Умаралӣ. С', deptCode: 'KADR001' },
      { name: 'Қаландарзода Абдуқаюм. Ҷ', deptCode: 'ATMOSFERA001' },
      { name: 'Давлатзода Сарвар', deptCode: 'DIGITAL001' },
      { name: 'Зарифзода Фарҳод. Т', deptCode: 'MOHI001' },
      { name: 'Идизод Неъматулло. Р', deptCode: 'FINANCE001' },
      { name: 'Қурбонзода Фируз. А', deptCode: 'INTERNATIONAL001' },
      { name: 'Маҳмудов Насим. З', deptCode: 'HUQUQI001' },
      { name: 'Раҳмоналӣ Маҳмадалӣ', deptCode: 'PARTOVHO001' },
      { name: 'Давлатзода Афзал. А', deptCode: 'WATER001' },
      { name: 'Бобохонзода Адолатхон. О', deptCode: 'PROTECTED021' },
      { name: 'Шамсиддинзода Хуршед.Ш', deptCode: 'NATURE022' },
      { name: 'Дустзода Ҳасан. Т', deptCode: 'TABIAT001' },
      { name: 'Шерматов Хисравшоҳ. Р', deptCode: 'WATERRES024' },
      { name: 'Сафаров Фирузю П', deptCode: 'ZIST001' },
      { name: 'Улуғов Умидҷон. А', deptCode: 'STOCKHOLM001' },
      { name: 'Тиллои Гулрухсор. А', deptCode: 'AHBOR001' },
      { name: 'Аҳрорзода Ҳамароҳ. Ҳ', deptCode: 'TASHHISI001' },
      { name: 'Судурзода Саидисмон. С', deptCode: 'STANDARD001' },
      { name: 'Ятимов Олимҷон. Р', deptCode: 'BIOLOGI001' },
      { name: 'Ҷунайдзода Муҳибулло.Ҳ', deptCode: 'OZON001' },
      { name: 'Панҷиев Аъзам. А', deptCode: 'SARMOYA001' },
      { name: 'Яқубов Ҷамолиддин. Н', deptCode: 'TAMIR001' },
      { name: 'Каримов Алихон. А', deptCode: 'INSON001' },
      { name: 'Алмосов Сафаралӣ. А', deptCode: 'HIFZITABIAT001' },
      { name: 'Ашуриён Хуршед. Қ', deptCode: 'ILMTABIAT001' },
      { name: 'Юсуфзода Абдуҷалил.Ҳ', deptCode: 'SAYOHAT001' },
      { name: 'Маҳмадализода Шарофиддин. А', deptCode: 'VARZOB001' },
      { name: 'Камолзода Дилшод. Н', deptCode: 'RUDAKI001' },
      { name: 'Каримзода Акмал. Т', deptCode: 'HISOR001' },
      { name: 'Нуров Муродулло.Т', deptCode: 'SHAHRINAV001' },
      { name: 'Расуло Ҷамшед. Д', deptCode: 'TURSUNZODA001' },
      { name: 'Буев Абдулазиз. А', deptCode: 'VAHDAT001' },
      { name: 'Камолов Эраҷ. Т', deptCode: 'FAYZOBOD001' },
      { name: 'Раҷабов Сайҷафар. Д', deptCode: 'RASHT001' },
      { name: 'Саъдуллоев Бекназар. С', deptCode: 'ROGUN001' },
      { name: 'Ҳуҷумбороа Фазлиддин. С', deptCode: 'LAKHSH001' },
    ];

    // Create people with department link
    console.log('\n');
    for (const person of peopleData) {
      const existing = await db.select().from(people).where(eq(people.name, person.name));
      
      let departmentId = null;
      if (person.deptCode) {
        const dept = await db.select().from(departments).where(eq(departments.accessCode, person.deptCode));
        if (dept.length > 0) {
          departmentId = dept[0].id;
        }
      }

      if (existing.length === 0) {
        await db.insert(people).values({
          name: person.name,
          departmentId: departmentId,
        });
        console.log(`✓ Иҷрокунанда илова карда шуд: ${person.name} (${person.deptCode || 'бе департамент'})`);
      } else {
        // Update existing person with department if not set
        await db.update(people)
          .set({ departmentId })
          .where(eq(people.id, existing[0].id));
        console.log(`✓ Иҷрокунанда навсозӣ шуд: ${person.name} (${person.deptCode || 'бе департамент'})`);
      }
    }

    console.log('\nSeeding completed successfully!');
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Admin Login:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('\nSample Department Codes:');
    console.log('  ROHBAR001 - Роҳбарият');
    console.log('  KADR001 - Раёсати кадрҳо, коргузорӣ ва назорат');
    console.log('  DIGITAL001 - Раёсати рақамикунонӣ ва инноватсия');
    console.log('  DUSHANBE001 - Сарраёсати ш. Душанбе');
    console.log('========================\n');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
