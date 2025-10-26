import 'dotenv/config';
import { db } from './db';
import { departments, admins } from '../shared/schema';
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
    const departmentData = [
      // Верхний блок (Upper Block)
      { name: 'Дастгоҳи марказӣ', block: 'upper', accessCode: 'CENTRAL001' },
      { name: 'Шуъбаи умумӣ', block: 'upper', accessCode: 'GENERAL002' },
      { name: 'Сарраёсати ш. Душанбе', block: 'upper', accessCode: 'DUSHANBE003' },
      { name: 'Агентии обуҳавошиносӣ', block: 'upper', accessCode: 'HYDRO004' },
      { name: 'Сарраёсати Вилояти Суғд', block: 'upper', accessCode: 'SUGHD005' },
      { name: 'Сарраёсати ВМКБ', block: 'upper', accessCode: 'GBAO006' },
      { name: 'Раёсати экспертизаи давлатии экологӣ', block: 'upper', accessCode: 'ECOEXPERT007' },
      { name: 'Шуъба ва бахшҳои НТМ', block: 'upper', accessCode: 'NTM008' },
      { name: 'Сарраёсати Вилояти Хатлон', block: 'upper', accessCode: 'KHATLON009' },
      { name: 'Раёсати КҲМЗ дар минтақаи Кӯлоб', block: 'upper', accessCode: 'KULOB010' },
      
      // Средний блок (Middle Block)
      { name: 'Раёсати мониторинг, сиёсати экологӣ, обуҳавошиносӣ ва кадастр', block: 'middle', accessCode: 'MONITOR011' },
      { name: 'Раёсати кадрҳо, коргузорӣ ва назорат', block: 'middle', accessCode: 'KADRY012' },
      { name: 'Раёсати назорати давлатии истифода ва ҳифзи ҳавои атмосфера', block: 'middle', accessCode: 'ATMOSFERA013' },
      { name: 'Раёсати рақамикунонӣ ва инноватсия', block: 'middle', accessCode: 'DIGITAL014' },
      { name: 'Раёсати назорати давлатии истифода ва ҳифзи олами набототу ҳайвонот ва захираҳои моҳӣ', block: 'middle', accessCode: 'WILDLIFE015' },
      { name: 'Раёсати банақшагирӣ, муҳосибот ва молия', block: 'middle', accessCode: 'FINANCE016' },
      { name: 'Раёсати робитаҳои байналмилалӣ ва кор бо конвенсияҳои экологӣ', block: 'middle', accessCode: 'INTL017' },
      { name: 'Бахши таъминоти ҳуқуқӣ', block: 'middle', accessCode: 'LEGAL018' },
      { name: 'Раёсати назорати давлатии истифода ва ҳифзи замин, канданиҳои фоиданоки маъмули ва муомилот бо партовҳо', block: 'middle', accessCode: 'LAND019' },
      { name: 'Раёсати назорати давлатии истифода ва ҳифзи захираҳои об', block: 'middle', accessCode: 'WATER020' },
      { name: 'Бахши ҳудудҳои табии махсус муҳофизатшаванда', block: 'middle', accessCode: 'PROTECTED021' },
      
      // Нижний блок (Lower Block)
      { name: 'Муассисаи давлатии "Ҳудудҳои табиии махсус муҳофизатшаванда"', block: 'lower', accessCode: 'NATURE022' },
      { name: 'Муассисаи давлатии "Лабораторияи илмию тадқиқотии ҳифзи табиат"', block: 'lower', accessCode: 'SCILAB023' },
      { name: 'Муассисаи давлатии "Маркази илмию тадқиқотии ҳифзи захираҳои об"', block: 'lower', accessCode: 'WATERRES024' },
      { name: 'Муассисаи давлатии "Маркази миллии амал оид ба ҳифзи муҳити зист"', block: 'lower', accessCode: 'ENVACTION025' },
      { name: 'Муассисаи давлатии "Маркази миллии иҷрои Конвенсияи Стокголм оид ба ифлоскунандаҳои устувори органикӣ"', block: 'lower', accessCode: 'STOCKHOLM026' },
      { name: 'Маркази ахбори экологӣ, тарғибот ва барномасозии компютерӣ', block: 'lower', accessCode: 'ECOINFO027' },
      { name: 'Маркази назоратию таҳлилию ташхисӣ', block: 'lower', accessCode: 'CONTROL028' },
      { name: 'Маркази стандартикунонӣ, методология ва меъёрҳои экологӣ', block: 'lower', accessCode: 'STANDARD029' },
      { name: 'Маркази миллии гуногунии биологӣ ва бехатарии биологӣ', block: 'lower', accessCode: 'BIODIV030' },
      { name: 'Маркази миллии ҳифзи қабати озон', block: 'lower', accessCode: 'OZONE031' },
      { name: 'Маркази татбиқи лоиҳаҳои сармоягузорӣ', block: 'lower', accessCode: 'INVEST032' },
      { name: 'Шуъбаи корҳои сохтмону таъмир', block: 'lower', accessCode: 'REPAIR033' },
      { name: 'Рӯзномаи "Инсон ва табиат"', block: 'lower', accessCode: 'NEWSPAPER034' },
      { name: 'Маҷаллаи "Ҳифзи табиат"', block: 'lower', accessCode: 'MAGAZINE035' },
      { name: 'Корхонаи воҳиди давлатии илмию истеҳсолии "Табиат"', block: 'lower', accessCode: 'TABIAT036' },
      { name: 'Корхонаи воҳиди давлатии "Сайду сайёҳат"', block: 'lower', accessCode: 'HUNTING037' },
      
      // Ноҳияҳои тобеи марказ (Districts Under Central Administration)
      { name: 'Шуъбаи КҲМЗ дар ноҳияи Варзоб', block: 'district', accessCode: 'DISTRICT038' },
      { name: 'Шуъбаи КҲМЗ дар ноҳияи Рудакӣ', block: 'district', accessCode: 'DISTRICT039' },
      { name: 'Шуъбаи КҲМЗ дар шаҳри Ҳисор', block: 'district', accessCode: 'DISTRICT040' },
      { name: 'Шуъбаи КҲМЗ дар ноҳияи Шаҳринав', block: 'district', accessCode: 'DISTRICT041' },
      { name: 'Шуъбаи КҲМЗ дар шаҳри Турсунзода', block: 'district', accessCode: 'DISTRICT042' },
      { name: 'Шуъбаи КҲМЗ дар шаҳри Ваҳдат', block: 'district', accessCode: 'DISTRICT043' },
      { name: 'Шуъбаи КҲМЗ дар ноҳияи Файзобод', block: 'district', accessCode: 'DISTRICT044' },
      { name: 'Шуъбаи КҲМЗ дар ноҳияи Рашт', block: 'district', accessCode: 'DISTRICT045' },
      { name: 'Бахши КҲМЗ дар шаҳри Роғун', block: 'district', accessCode: 'DISTRICT046' },
      { name: 'Бахши КҲМЗ дар ноҳичи Лахш', block: 'district', accessCode: 'DISTRICT047' },
      { name: 'Бахши КҲМЗ дар ноҳияи Сангвор', block: 'district', accessCode: 'DISTRICT048' },
      { name: 'Бахши КҲМЗ дар ноҳияи Нуробод', block: 'district', accessCode: 'DISTRICT049' },
      { name: 'Бахши КҲМЗ дар ноҳияи Тоҷикобод', block: 'district', accessCode: 'DISTRICT050' },
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

    console.log('\nSeeding completed successfully!');
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Admin Login:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('\nSample Department Codes:');
    console.log('  CENTRAL001 - Дастгоҳи марказӣ');
    console.log('  DUSHANBE003 - Сарраёсати ш. Душанбе');
    console.log('  HYDRO004 - Агентии обуҳавошиносӣ');
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
