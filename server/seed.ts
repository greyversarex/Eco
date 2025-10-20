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

    // Sample departments data
    const departmentData = [
      // Upper Block
      { name: 'Раёсати Душанбе', block: 'upper', accessCode: 'DUSHANBE001' },
      { name: 'Агентии обухаводонимоси', block: 'upper', accessCode: 'AGENT002' },
      { name: 'Сарраёсати Вилоҷи Суғд', block: 'upper', accessCode: 'SUGHD003' },
      { name: 'Сарраёсати ВМКБ', block: 'upper', accessCode: 'VMKB004' },
      
      // Middle Block
      { name: 'Раёсати мониторинги сифати экологӣ', block: 'middle', accessCode: 'MONITOR005' },
      { name: 'Шуъба аз Вилоҷи НТҲ', block: 'middle', accessCode: 'NTH006' },
      { name: 'Раёсати назорати давлатии истифода', block: 'middle', accessCode: 'NAZORAT007' },
      { name: 'Раёсати биологияҳои мухосибат', block: 'middle', accessCode: 'BIO008' },
      
      // Lower Block
      { name: 'Муассисаи давлатии "Худудхои табиӣ"', block: 'lower', accessCode: 'HUDUD009' },
      { name: 'Муассисаидавлатии "Лаборатория"', block: 'lower', accessCode: 'LAB010' },
      { name: 'Маркази стандартгузорӣ', block: 'lower', accessCode: 'STANDARD011' },
      { name: 'Маркази назорати тахлилнок', block: 'lower', accessCode: 'TAHLIL012' },
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
    console.log('  DUSHANBE001 - Раёсати Душанбе');
    console.log('  AGENT002 - Агентии обухаводонимоси');
    console.log('  SUGHD003 - Сарраёсати Вилоҷи Суғд');
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
