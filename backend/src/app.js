const express = require('express');
const cors = require('cors');
const competitionRoutes = require('./routes/competitions');

function createApp() {
  const app = express();
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin }));
  app.use(express.json({ limit: '2mb' }));
  app.use('/uploads', express.static('uploads'));
  app.get('/health', (_req, res) => res.json({ ok: true, service: 'feedants-backend' }));
  app.use('/api/competitions', competitionRoutes);
  app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
  app.use((err, _req, res, _next) => {
    if (err?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Submission file must be 100 MB or smaller' });
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
  });
  return app;
}

module.exports = { createApp };
