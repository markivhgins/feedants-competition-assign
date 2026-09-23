require('dotenv').config();
const mongoose = require('mongoose');
const { createApp } = require('./app');

const port = Number(process.env.PORT || 4000);
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/feedants?replicaSet=rs0';

async function connectWithRetry() {
  let lastError;
  for (let i = 0; i < 30; i += 1) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
      return;
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
}

async function start() {
  await connectWithRetry();
  const app = createApp();
  app.listen(port, '0.0.0.0', () => process.stdout.write(`Backend running on http://localhost:${port}\n`));
}

start().catch(error => {
  console.error(error);
  process.exit(1);
});
