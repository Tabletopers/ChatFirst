import { db } from './index';

export function runMigrations() {
  console.log('Database initialized successfully');
}

if (require.main === module) {
  runMigrations();
}
