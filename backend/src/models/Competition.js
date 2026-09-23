const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, required: true },
  image: { type: String, default: '' }
}, { _id: false });

const rewardSchema = new mongoose.Schema({
  position: { type: String, required: true },
  label: { type: String, required: true },
  amount: { type: Number, required: true }
}, { _id: false });

const competitionSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  format: { type: String, required: true },
  description: { type: String, required: true },
  judgingParameters: { type: String, required: true },
  rules: { type: String, required: true },
  prizePool: { type: Number, required: true, min: 0 },
  entryFee: { type: Number, required: true, min: 0 },
  maxParticipants: { type: Number, required: true, min: 1 },
  participantCount: { type: Number, default: 0, min: 0 },
  registrationEnd: { type: Date, required: true },
  submissionStart: { type: Date, required: true },
  submissionEnd: { type: Date, required: true },
  resultDate: { type: Date, required: true },
  startDate: { type: Date, required: true },
  judge: {
    name: { type: String, required: true },
    role: { type: String, required: true },
    experience: { type: String, required: true },
    image: { type: String, default: '' },
    introVideo: { type: String, default: '' }
  },
  winners: { type: [winnerSchema], default: [] },
  rewards: { type: [rewardSchema], default: [] },
  referralReward: { type: Number, default: 10 },
  referralCode: { type: String, default: 'referral123' },
  securePaymentProvider: { type: String, default: 'Razorpay' },
  certificateAvailable: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Competition', competitionSchema);
