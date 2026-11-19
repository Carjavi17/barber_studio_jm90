import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { publicName, toDto } from './reviews.js';

describe('publicName', () => {
  test('shortens the last name to an initial', () => {
    assert.equal(publicName('Carlos Guerra'), 'Carlos G.');
  });

  test('keeps only the first two words of longer names', () => {
    assert.equal(publicName('Carlos José Guerra Barrios'), 'Carlos J.');
  });

  test('returns a single name as is', () => {
    assert.equal(publicName('Carlos'), 'Carlos');
  });

  test('ignores extra spaces and capitalizes the initial', () => {
    assert.equal(publicName('  Ana    maría  '), 'Ana M.');
  });

  test('handles an empty name without crashing', () => {
    assert.equal(publicName('   '), '');
  });
});

describe('toDto', () => {
  const review = {
    id: 7,
    rating: 5,
    comment: 'Excelente corte',
    isVisible: true,
    createdAt: new Date('2026-11-20T15:00:00Z'),
    clientId: 5,
    client: { name: 'Carlos Guerra' },
    barber: { id: 2, name: 'Jose' },
    appointment: { serviceName: 'Corte de Cabello' },
  };

  test('shows the short name to regular users', () => {
    assert.equal(toDto(review, 99).authorName, 'Carlos G.');
  });

  test('shows the full name to the admin', () => {
    assert.equal(toDto(review, 1, { fullName: true }).authorName, 'Carlos Guerra');
  });

  test('marks the review as mine only for its author', () => {
    assert.equal(toDto(review, 5).isMine, true);
    assert.equal(toDto(review, 6).isMine, false);
  });

  test('exposes only the expected fields (no client id, email or phone)', () => {
    const keys = Object.keys(toDto(review, 99)).sort();

    assert.deepEqual(keys, [
      'authorName', 'barberName', 'comment', 'createdAt', 'id', 'isMine', 'isVisible', 'rating', 'serviceName',
    ]);
  });
});
