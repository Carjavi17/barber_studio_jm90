import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { getNextDays } from './dates';

const pad = (n) => String(n).padStart(2, '0');

describe('getNextDays', () => {
  test('returns the requested number of days (14 by default)', () => {
    assert.equal(getNextDays().length, 14);
    assert.equal(getNextDays(3).length, 3);
  });

  test('starts today', () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    assert.equal(getNextDays(1)[0].value, today);
  });

  test('values are YYYY-MM-DD, unique and in consecutive order', () => {
    const days = getNextDays(60); // long enough to cross month boundaries

    days.forEach((d) => assert.match(d.value, /^\d{4}-\d{2}-\d{2}$/));
    assert.equal(new Set(days.map((d) => d.value)).size, 60);

    for (let i = 1; i < days.length; i++) {
      const [y1, m1, d1] = days[i - 1].value.split('-').map(Number);
      const [y2, m2, d2] = days[i].value.split('-').map(Number);
      const gap = (Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000;

      assert.equal(gap, 1, `${days[i - 1].value} -> ${days[i].value}`);
    }
  });

  test('each day carries what the picker shows', () => {
    const [first] = getNextDays(1);

    assert.equal(typeof first.weekday, 'string');
    assert.equal(typeof first.month, 'string');
    assert.equal(typeof first.day, 'number');
    assert.ok(first.day >= 1 && first.day <= 31);
  });
});
