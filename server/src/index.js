import 'dotenv/config';
import { createApp } from './app.js';
import { createDatabase } from './db.js';

const port = Number(process.env.PORT || 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

const database = createDatabase();
const app = createApp(database);

const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Finance Tracker API listening on http://127.0.0.1:${port}`);
});

function shutdown() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
