const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Competition = require('../models/Competition');
const Participation = require('../models/Participation');
const { getLifecycle, canRegister, canSubmit } = require('../utils/lifecycle');

const router = express.Router();
const upload = multer({
  dest: path.resolve('uploads'),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) return cb(null, true);
    const error = new Error('Only image and video submissions are allowed');
    error.status = 415;
    cb(error);
  }
});

function requireUser(req, res, next) {
  const userId = String(req.query.userId || req.body.userId || '').trim();
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  req.userId = userId;
  next();
}

function formatDate(date) {
  return new Date(date).toISOString();
}

function removeUploadedFile(file) {
  if (!file?.path) return;
  try { fs.unlinkSync(file.path); } catch {}
}

function serialize(competition, participation) {
  const lifecycle = getLifecycle(competition);
  return {
    id: competition._id.toString(),
    slug: competition.slug,
    title: competition.title,
    category: competition.category,
    format: competition.format,
    description: competition.description,
    judgingParameters: competition.judgingParameters,
    rules: competition.rules,
    prizePool: competition.prizePool,
    entryFee: competition.entryFee,
    maxParticipants: competition.maxParticipants,
    participantCount: competition.participantCount,
    remainingSpots: Math.max(competition.maxParticipants - competition.participantCount, 0),
    registrationEnd: formatDate(competition.registrationEnd),
    submissionStart: formatDate(competition.submissionStart),
    submissionEnd: formatDate(competition.submissionEnd),
    resultDate: formatDate(competition.resultDate),
    startDate: formatDate(competition.startDate),
    lifecycle,
    isRegistered: Boolean(participation),
    participationStatus: participation?.status || null,
    submission: participation?.submission || null,
    judge: competition.judge,
    winners: competition.winners,
    rewards: competition.rewards,
    referralReward: competition.referralReward,
    referralCode: competition.referralCode,
    securePaymentProvider: competition.securePaymentProvider,
    certificateAvailable: competition.certificateAvailable
  };
}

router.get('/:slug', requireUser, async (req, res, next) => {
  try {
    const competition = await Competition.findOne({ slug: req.params.slug }).lean();
    if (!competition) return res.status(404).json({ error: 'Competition not found' });
    const participation = await Participation.findOne({ competitionId: competition._id, userId: req.userId }).lean();
    res.json(serialize(competition, participation));
  } catch (error) {
    next(error);
  }
});

router.post('/:slug/register', requireUser, async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const competition = await Competition.findOne({ slug: req.params.slug }).session(session);
    if (!competition) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Competition not found' });
    }
    if (!canRegister(competition)) {
      await session.abortTransaction();
      if (competition.participantCount >= competition.maxParticipants) return res.status(409).json({ error: 'Competition is full' });
      return res.status(409).json({ error: 'Registration is closed' });
    }
    const existing = await Participation.findOne({ competitionId: competition._id, userId: req.userId }).session(session);
    if (existing) {
      await session.abortTransaction();
      return res.status(200).json({ registered: true, alreadyRegistered: true });
    }
    await Participation.create([{ competitionId: competition._id, userId: req.userId, status: 'registered' }], { session });
    const updated = await Competition.findOneAndUpdate(
      { _id: competition._id, participantCount: { $lt: competition.maxParticipants } },
      { $inc: { participantCount: 1 } },
      { new: true, session }
    );
    if (!updated) {
      await session.abortTransaction();
      return res.status(409).json({ error: 'Competition became full. Please try again.' });
    }
    await session.commitTransaction();
    res.status(201).json({ registered: true, remainingSpots: updated.maxParticipants - updated.participantCount });
  } catch (error) {
    try { await session.abortTransaction(); } catch {}
    if (error?.code === 11000) return res.status(200).json({ registered: true, alreadyRegistered: true });
    next(error);
  } finally {
    await session.endSession();
  }
});

router.post('/:slug/submission', requireUser, upload.single('file'), async (req, res, next) => {
  try {
    const competition = await Competition.findOne({ slug: req.params.slug });
    if (!competition) {
      removeUploadedFile(req.file);
      return res.status(404).json({ error: 'Competition not found' });
    }
    if (!canSubmit(competition)) {
      removeUploadedFile(req.file);
      return res.status(409).json({ error: 'Submission window is closed' });
    }
    const participation = await Participation.findOne({ competitionId: competition._id, userId: req.userId });
    if (!participation) {
      removeUploadedFile(req.file);
      return res.status(403).json({ error: 'User is not registered' });
    }
    if (!req.file) return res.status(400).json({ error: 'A submission file is required' });
    if (participation.status === 'submitted') {
      removeUploadedFile(req.file);
      return res.status(409).json({ error: 'Submission already uploaded' });
    }
    participation.status = 'submitted';
    participation.submission = {
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storedPath: `/uploads/${req.file.filename}`,
      submittedAt: new Date()
    };
    await participation.save();
    res.status(201).json({ submitted: true, submission: participation.submission });
  } catch (error) {
    if (error?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Submission file must be 100 MB or smaller' });
    removeUploadedFile(req.file);
    next(error);
  }
});

module.exports = router;
