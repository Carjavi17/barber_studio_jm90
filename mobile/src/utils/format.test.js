import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { formatPrice, formatDuration, formatRating } from './format';

describe('formatPrice', () => {
  test('writes pesos with dots as thousands separators', () => {
    assert.equal(formatPrice(20000), '$20.000 ARS');
    assert.equal(formatPrice(26000), '$26.000 ARS');
  });

  test('works for small and very large amounts', () => {
    assert.equal(formatPrice(950), '$950 ARS');
    assert.equal(formatPrice(1000000), '$1.000.000 ARS');
  });

  test('handles 1 and 0', () => {
    assert.equal(formatPrice(1), '$1 ARS');
    assert.equal(formatPrice(0), '$0 ARS');
  });
});

describe('formatDuration', () => {
  test('appends the unit in minutes', () => {
    assert.equal(formatDuration(30), '30 min');
    assert.equal(formatDuration(60), '60 min');
  });
});

describe('formatRating', () => {
  test('uses a decimal comma and one decimal', () => {
    assert.equal(formatRating(4.64), '4,6');
    assert.equal(formatRating(4.66), '4,7');
  });

  test('keeps the decimal on whole numbers', () => {
    assert.equal(formatRating(5), '5,0');
  });
});
