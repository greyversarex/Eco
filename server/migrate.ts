import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './db';

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: 'drizzle' });
  console.log('Migrations finished!');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
