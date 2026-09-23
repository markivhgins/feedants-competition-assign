const mongoose = require('mongoose');

const participationSchema = new mongoose.Schema({
  competitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition', required: true, index: true },
  userId: { type: String, required: true, index: true },
  status: { type: String, enum: ['registered', 'submitted', 'completed'], default: 'registered' },
  registeredAt: { type: Date, default: Date.now },
  submission: {
    fileName: { type: String, default: '' },
    originalName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    storedPath: { type: String, default: '' },
    submittedAt: { type: Date, default: null }
  }
}, { timestamps: true });

participationSchema.index({ competitionId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Participation', participationSchema);
