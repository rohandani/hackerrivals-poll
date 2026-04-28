import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pollRoutes from './routes/polls.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
if (NODE_ENV === 'development') {
  app.use(cors());
}
app.use(express.json());

// API routes
app.use('/api/polls', pollRoutes);

// In production, serve the built frontend
if (NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} [${NODE_ENV}]`);
});

export default app;
