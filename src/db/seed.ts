import { v4 as uuidv4 } from 'uuid';
import { db } from './index';

export function seedDatabase() {
  const demoUserId = uuidv4();
  const demoPassword = 'demo123456';

  const insert = db.connection.prepare(`
    INSERT INTO users (id, email, password_hash, name, persona_tone)
    VALUES (?, ?, ?, ?, ?)
  `);

  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync(demoPassword, 10);

  insert.run(demoUserId, 'demo@chatfirst.ai', hash, 'Demo User', 'supportive');

  const insertGoal = db.connection.prepare(`
    INSERT INTO goals (id, user_id, title, description, deadline, status, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const goalId = uuidv4();
  insertGoal.run(goalId, demoUserId, 'Build ChatFirst MVP', 'Launch the initial version of ChatFirst', '2025-12-31', 'active', 'high');

  const insertCommitment = db.connection.prepare(`
    INSERT INTO commitments (id, user_id, goal_id, description, frequency, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const commitmentId = uuidv4();
  insertCommitment.run(commitmentId, demoUserId, goalId, 'Daily coding session', 'daily', 'active');

  const insertMemory = db.connection.prepare(`
    INSERT INTO memories (id, user_id, content, category, importance)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertMemory.run(uuidv4(), demoUserId, 'User prefers morning check-ins around 8 AM', 'preferences', 8);
  insertMemory.run(uuidv4(), demoUserId, 'User is building a proactive AI companion app', 'context', 9);
  insertMemory.run(uuidv4(), demoUserId, 'User likes gentle reminders, not pushy ones', 'preferences', 7);

  console.log('Database seeded successfully');
  console.log(`Demo account: demo@chatfirst.ai / ${demoPassword}`);
}

if (require.main === module) {
  seedDatabase();
}
