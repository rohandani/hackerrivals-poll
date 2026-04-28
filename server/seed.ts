import { v4 as uuidv4 } from 'uuid';
import db from './db.js';

const polls = [
  {
    id: uuidv4(),
    question: 'Which framework should win?',
    options: ['React', 'Vue', 'Svelte', 'Angular'],
  },
  {
    id: uuidv4(),
    question: 'Best programming language for 2026?',
    options: ['TypeScript', 'Rust', 'Go', 'Python'],
  },
  {
    id: uuidv4(),
    question: 'Favorite hackathon snack?',
    options: ['Pizza', 'Energy Drinks', 'Ramen', 'Coffee'],
  },
];

const insertPoll = db.prepare('INSERT OR IGNORE INTO polls (id, question) VALUES (?, ?)');
const insertOption = db.prepare('INSERT INTO poll_options (poll_id, text) VALUES (?, ?)');

const seedAll = db.transaction(() => {
  for (const poll of polls) {
    const result = insertPoll.run(poll.id, poll.question);
    if (result.changes > 0) {
      for (const option of poll.options) {
        insertOption.run(poll.id, option);
      }
      console.log(`Created poll: "${poll.question}" (${poll.id})`);
    } else {
      console.log(`Poll already exists, skipped: "${poll.question}"`);
    }
  }
});

seedAll();
console.log('Seeding complete.');
