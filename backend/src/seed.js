require('dotenv').config();
const mongoose = require('mongoose');
const Competition = require('./models/Competition');
const Participation = require('./models/Participation');

async function connect() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/feedants?replicaSet=rs0';
  let lastError;
  for (let i = 0; i < 20; i += 1) {
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

async function seed() {
  await connect();
  const now = new Date();
  const phase = process.env.DEMO_PHASE || 'registration';
  const startDate = phase === 'submission' ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const registrationEnd = phase === 'submission' ? new Date(now.getTime() - 2 * 60 * 60 * 1000) : new Date(now.getTime() + 26 * 60 * 60 * 1000);
  const submissionStart = phase === 'submission' ? new Date(now.getTime() - 60 * 60 * 1000) : new Date(registrationEnd.getTime() + 60 * 60 * 1000);
  const submissionEnd = new Date(now.getTime() + (phase === 'submission' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000));
  const resultDate = new Date(submissionEnd.getTime() + 2 * 24 * 60 * 60 * 1000);
  const payload = {
    slug: 'feedants-classical-dance',
    title: 'Feedants Classical Dance',
    category: 'Dance',
    format: 'Multi-Win',
    description: 'This is an online classical dance competition open for all age groups. Participate from anywhere and showcase your talent. Express your passion through traditional dance.',
    judgingParameters: 'Technique, expression, rhythm, presentation, musicality, and overall stage presence.',
    rules: 'Submit one original classical dance performance. Keep the video clear, single-performer, and within the configured submission limits.',
    prizePool: 1500,
    entryFee: 99,
    maxParticipants: 20,
    participantCount: 1,
    registrationEnd,
    submissionStart,
    submissionEnd,
    resultDate,
    startDate,
    judge: {
      name: 'Manju Dubey',
      role: 'Professional Kathak Dancer',
      experience: '12+ Years of Experience',
      image: 'judge.jpg',
      introVideo: 'https://www.youtube.com/'
    },
    winners: [
      { name: 'Riya Shah', position: '1st Winner', image: 'winner1.jpg' },
      { name: 'Aarav Mehta', position: '1st Winner', image: 'winner2.jpg' },
      { name: 'Neha Verma', position: '2nd Winner', image: 'winner3.jpg' },
      { name: 'Ishita Chopra', position: '3rd Winner', image: 'winner4.jpg' }
    ],
    rewards: [
      { position: '1', label: '1st Winner', amount: 550 },
      { position: '2', label: '2nd Winner', amount: 300 },
      { position: '3', label: '3rd Winner', amount: 240 },
      { position: '4', label: '4th Winner', amount: 200 },
      { position: '5', label: '5th Winner', amount: 130 },
      { position: '6', label: '6th Winner', amount: 80 }
    ],
    referralReward: 10,
    referralCode: 'referral123',
    securePaymentProvider: 'Razorpay',
    certificateAvailable: true
  };
  const competition = await Competition.findOneAndUpdate({ slug: payload.slug }, payload, { upsert: true, new: true, setDefaultsOnInsert: true });
  await Participation.deleteMany({ competitionId: competition._id });
  await Participation.create({ competitionId: competition._id, userId: process.env.DEMO_USER_ID || 'demo-user-001', status: 'registered' });
  await mongoose.disconnect();
  process.stdout.write(`Seeded ${payload.slug} (${phase} phase)\n`);
}

seed().catch(async error => {
  console.error(error);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
