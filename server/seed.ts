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

    // Get all departments for people assignment
    const allDepartments = await db.select().from(departments);
    
    // Sample people data for different departments
    const peopleData = [
      // Роҳбарият
      { name: 'Раҳимов Фаррух Нозимович', departmentName: 'Роҳбарият' },
      { name: 'Қосимова Зарина Муҳаммадиевна', departmentName: 'Роҳбарият' },
      
      // Раёсати кадрҳо
      { name: 'Саидов Шоҳруҳ Баҳодурович', departmentName: 'Раёсати кадрҳо, коргузорӣ ва назорат' },
      { name: 'Раҳмонова Малика Икромовна', departmentName: 'Раёсати кадрҳо, коргузорӣ ва назорат' },
      { name: 'Назаров Достон Нозимович', departmentName: 'Раёсати кадрҳо, коргузорӣ ва назорат' },
      
      // Раёсати рақамикунонӣ
      { name: 'Иброҳимов Алишер Азизович', departmentName: 'Раёсати рақамикунонӣ ва инноватсия' },
      { name: 'Муродова Нилуфар Саидовна', departmentName: 'Раёсати рақамикунонӣ ва инноватсия' },
      { name: 'Усмонов Бахтиёр Раҳматович', departmentName: 'Раёсати рақамикунонӣ ва инноватсия' },
      
      // Раёсати мониторинг
      { name: 'Холиқов Ҷамшед Фарҳодович', departmentName: 'Раёсати мониторинг, сиёсати экологӣ, обуҳавошиносӣ ва кадастр' },
      { name: 'Аминова Дилором Абдуллоевна', departmentName: 'Раёсати мониторинг, сиёсати экологӣ, обуҳавошиносӣ ва кадастр' },
      
      // Раёсати молия
      { name: 'Каримов Зафар Муҳаммадович', departmentName: 'Раёсати банақшагирӣ, муҳосибот ва молия' },
      { name: 'Ҷалилова Фарангез Азизовна', departmentName: 'Раёсати банақшагирӣ, муҳосибот ва молия' },
      { name: 'Ҳасанов Умед Валиевич', departmentName: 'Раёсати банақшагирӣ, муҳосибот ва молия' },
      
      // Раёсати робитаҳои байналмилалӣ
      { name: 'Шарифов Рустам Олимович', departmentName: 'Раёсати робитаҳои байналмилалӣ ва кор бо конвенсияҳои экологӣ' },
      { name: 'Саломова Гулноза Муродовна', departmentName: 'Раёсати робитаҳои байналмилалӣ ва кор бо конвенсияҳои экологӣ' },
      
      // Раёсати назорати об
      { name: 'Мирзоев Далер Шукурович', departmentName: 'Раёсати назорати давлатии истифода ва ҳифзи захираҳои об' },
      { name: 'Юсуфова Парвина Ҳасановна', departmentName: 'Раёсати назорати давлатии истифода ва ҳифзи захираҳои об' },
      { name: 'Бобоев Абдулло Икромович', departmentName: 'Раёсати назорати давлатии истифода ва ҳифзи захираҳои об' },
      
      // Сарраёсати ш. Душанбе
      { name: 'Раҳмонов Санҷар Баҳромович', departmentName: 'Сарраёсати ш. Душанбе' },
      { name: 'Одинаева Мунира Асадуллоевна', departmentName: 'Сарраёсати ш. Душанбе' },
      { name: 'Қурбонов Фаррух Шоҳрухович', departmentName: 'Сарраёсати ш. Душанбе' },
      
      // Шуъбаи умумӣ
      { name: 'Исмоилов Дилшод Раҳматович', departmentName: 'Шуъбаи умумӣ' },
      { name: 'Азимова Лайло Баҳромовна', departmentName: 'Шуъбаи умумӣ' },
      
      // Раёсати экспертизаи давлатии экологӣ
      { name: 'Назаров Фируз Абдуллоевич', departmentName: 'Раёсати экспертизаи давлатии экологӣ' },
      { name: 'Акбарова Ҳилола Муродовна', departmentName: 'Раёсати экспертизаи давлатии экологӣ' },
    ];

    // Create people
    console.log('\n');
    for (const personData of peopleData) {
      const dept = allDepartments.find(d => d.name === personData.departmentName);
      if (dept) {
        const existing = await db.select().from(people).where(eq(people.name, personData.name));
        
        if (existing.length === 0) {
          await db.insert(people).values({
            name: personData.name,
            departmentId: dept.id,
          });
          console.log(`✓ Person created: ${personData.name} (${personData.departmentName})`);
        } else {
          console.log(`✓ Person already exists: ${personData.name}`);
        }
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
