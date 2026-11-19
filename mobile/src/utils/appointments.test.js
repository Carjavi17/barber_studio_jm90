import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { groupByDay } from './appointments';
import { formatDay } from './dates';

// Times at 15:00-16:00 UTC stay on the same calendar day in every time zone from the Americas to Europe,
// and two days apart is always a different day, so these tests don't depend on the machine's time zone
const appointment = (id, startsAt) => ({ id, startsAt });

describe('groupByDay', () => {
  test('returns an empty list for no appointments', () => {
    assert.deepEqual(groupByDay([]), []);
  });

  test('puts appointments of the same day in one section, keeping their order', () => {
    const list = [
      appointment(1, '2026-11-25T15:00:00.000Z'),
      appointment(2, '2026-11-25T16:00:00.000Z'),
    ];

    const sections = groupByDay(list);

    assert.equal(sections.length, 1);
    assert.deepEqual(sections[0].data.map((a) => a.id), [1, 2]);
  });

  test('starts a new section when the day changes', () => {
    const list = [
      appointment(1, '2026-11-25T15:00:00.000Z'),
      appointment(2, '2026-11-27T15:00:00.000Z'),
      appointment(3, '2026-11-27T16:00:00.000Z'),
    ];

    const sections = groupByDay(list);

    assert.equal(sections.length, 2);
    assert.deepEqual(sections.map((s) => s.data.length), [1, 2]);
  });

  test('titles each section with the formatted day', () => {
    const [section] = groupByDay([appointment(1, '2026-11-25T15:00:00.000Z')]);

    assert.equal(section.title, formatDay('2026-11-25T15:00:00.000Z'));
  });

  test('does not lose or duplicate appointments', () => {
    const list = [1, 2, 3, 4, 5].map((i) => appointment(i, `2026-11-${20 + i * 2}T15:00:00.000Z`));

    const total = groupByDay(list).reduce((count, s) => count + s.data.length, 0);

    assert.equal(total, list.length);
  });
});
