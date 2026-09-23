const test = require('node:test');
const assert = require('node:assert/strict');
const { getLifecycle, canRegister, canSubmit } = require('./lifecycle');

function competition() {
  const base = new Date('2026-01-01T00:00:00.000Z');
  return {
    startDate: new Date(base),
    registrationEnd: new Date('2026-01-02T00:00:00.000Z'),
    submissionStart: new Date('2026-01-03T00:00:00.000Z'),
    submissionEnd: new Date('2026-01-04T00:00:00.000Z'),
    resultDate: new Date('2026-01-05T00:00:00.000Z'),
    participantCount: 2,
    maxParticipants: 20
  };
}

test('lifecycle transitions are time dependent', () => {
  const item = competition();
  assert.equal(getLifecycle(item, new Date('2025-12-31T23:00:00Z')), 'upcoming');
  assert.equal(getLifecycle(item, new Date('2026-01-01T12:00:00Z')), 'registration_open');
  assert.equal(getLifecycle(item, new Date('2026-01-02T12:00:00Z')), 'registration_closed');
  assert.equal(getLifecycle(item, new Date('2026-01-03T12:00:00Z')), 'submission_open');
  assert.equal(getLifecycle(item, new Date('2026-01-04T12:00:00Z')), 'submission_closed');
  assert.equal(getLifecycle(item, new Date('2026-01-06T12:00:00Z')), 'results_published');
});

test('registration and submission flags follow lifecycle and capacity', () => {
  const item = competition();
  assert.equal(canRegister(item, new Date('2026-01-01T12:00:00Z')), true);
  item.participantCount = 20;
  assert.equal(canRegister(item, new Date('2026-01-01T12:00:00Z')), false);
  item.participantCount = 2;
  assert.equal(canSubmit(item, new Date('2026-01-03T12:00:00Z')), true);
});
