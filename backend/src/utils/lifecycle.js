function getLifecycle(competition, now = new Date()) {
  const t = now.getTime();
  const start = new Date(competition.startDate).getTime();
  const registrationEnd = new Date(competition.registrationEnd).getTime();
  const submissionStart = new Date(competition.submissionStart).getTime();
  const submissionEnd = new Date(competition.submissionEnd).getTime();
  const resultDate = new Date(competition.resultDate).getTime();

  if (t < start) return 'upcoming';
  if (t < registrationEnd) return 'registration_open';
  if (t < submissionStart) return 'registration_closed';
  if (t < submissionEnd) return 'submission_open';
  if (t < resultDate) return 'submission_closed';
  return 'results_published';
}

function canRegister(competition, now = new Date()) {
  return getLifecycle(competition, now) === 'registration_open' && competition.participantCount < competition.maxParticipants;
}

function canSubmit(competition, now = new Date()) {
  const state = getLifecycle(competition, now);
  return state === 'submission_open';
}

module.exports = { getLifecycle, canRegister, canSubmit };
